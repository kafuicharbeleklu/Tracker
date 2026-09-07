import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle, Hourglass, Laptop, Wrench, XCircle } from '@phosphor-icons/react';

import ActSheet, { type ActChoice, type ConsequenceTone } from '../../../components/ui/ActSheet';
import ActScanOverlay from './ActScanOverlay';
import FilePicker from '../../../components/ui/FilePicker';
import Icon from '../../../components/ui/Icon';
import { TextArea } from '../../../components/ui/TextArea';
import { FieldLabel, OptionRow, ShotBox, type Tint } from '../../../components/ui/FormParts';
import type { AttestationMethod } from '../../../components/ui/Attestation';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import {
    getEquipmentUpdatesForReturnWorkflow,
    type ReturnInspectionCondition,
} from '../../../lib/businessRules';
import { formatDate } from '../../../lib/financial';
import type { Equipment, User } from '../../../types';

/**
 * **Le retour** — deux actes de la table de **17.4**, une seule feuille.
 *
 * L'assistant de retour tenait quatre étapes plein écran pour ce que la planche décrit
 * comme deux gestes distincts, portés par deux personnes :
 *
 * | Acte | Qui | 2 · autre partie | 3 · la question | Verbe |
 * | --- | --- | --- | --- | --- |
 * | Restituer | la personne | l'informatique du site | un mot sur l'état | Je rends |
 * | Réceptionner le retour | l'informatique | — | photos · ce que l'objet devient | Réceptionner |
 *
 * **C'est l'objet qui dit lequel des deux s'ouvre** : un objet attribué se restitue, un
 * objet en *retour à confirmer* se réceptionne. La feuille ne le demande pas, et il n'y
 * a jamais de choix à faire entre les deux.
 *
 * ## La réception est le seul acte du parcours qui ne soit pas symétrique
 *
 * On est devant l'objet : attester seul ne suffit pas, il faut dire **dans quel état il
 * revient**, parce que c'est ce qui décide s'il repart en stock. Les crans sont nommés
 * par leur conséquence — « Repart en stock », « À réviser d'abord », « Hors service » —
 * et la photo passe avant le texte : une rayure se photographie en une seconde et se
 * décrit mal en trois phrases.
 */

/** Les trois crans de l'écran pointent des entrées du barème, jamais des degrés d'usure. */
const CRANS: Array<{
    value: ReturnInspectionCondition;
    title: string;
    hint: string;
    tint: Tint;
}> = [
    { value: 'Bon', title: 'Repart en stock', hint: 'Rien à signaler', tint: 'vert' },
    {
        value: 'Mauvais',
        title: 'À réviser d’abord',
        hint: 'Ne sera pas proposé avant l’intervention',
        tint: 'orange',
    },
    {
        value: 'Hors service',
        title: 'Hors service',
        hint: 'Sortie d’inventaire — passe « Retiré », l’historique reste',
        tint: 'rouge',
    },
];

const CONSEQUENCE: Record<
    ReturnInspectionCondition,
    { tone: ConsequenceTone; glyph: typeof CheckCircle; text: React.ReactNode }
> = {
    Excellent: {
        tone: 'vert',
        glyph: CheckCircle,
        text: (
            <>
                L’objet <strong>repasse « Disponible »</strong> et peut être réattribué sans délai.
            </>
        ),
    },
    Bon: {
        tone: 'vert',
        glyph: CheckCircle,
        text: (
            <>
                L’objet <strong>repasse « Disponible »</strong> et peut être réattribué sans délai.
            </>
        ),
    },
    Moyen: {
        tone: 'vert',
        glyph: CheckCircle,
        text: (
            <>
                L’objet <strong>repasse « Disponible »</strong> et peut être réattribué sans délai.
            </>
        ),
    },
    Mauvais: {
        tone: 'orange',
        glyph: Wrench,
        text: (
            <>
                L’objet passe <strong>en réparation</strong>. Il ne rejoint pas les disponibles.
            </>
        ),
    },
    Dégradé: {
        tone: 'orange',
        glyph: Wrench,
        text: (
            <>
                L’objet passe <strong>en maintenance préventive</strong> avant de repartir.
            </>
        ),
    },
    'Hors service': {
        tone: 'rouge',
        glyph: XCircle,
        text: (
            <>
                L’objet passe <strong>« Retiré »</strong> : il sort des disponibles, son historique
                et ses attestations restent.
            </>
        ),
    },
};

interface ReturnActSheetProps {
    open: boolean;
    onClose: () => void;
    /** L'objet désigné par l'entrée — fiche, tâche, lien profond. */
    initialEquipmentId?: string;
}

const ReturnActSheet: React.FC<ReturnActSheetProps> = ({ open, onClose, initialEquipmentId }) => {
    const { equipment, users, updateEquipment } = useData();
    const { showToast } = useToast();
    const { user: actor } = useAccessControl();

    const [objetId, setObjetId] = useState<string | null>(null);
    const [cran, setCran] = useState<ReturnInspectionCondition>('Bon');
    const [photos, setPhotos] = useState<string[]>([]);
    const [refusPhoto, setRefusPhoto] = useState<string | null>(null);
    const [commentaire, setCommentaire] = useState('');
    const [refus, setRefus] = useState<string | null>(null);
    const [scanOuvert, setScanOuvert] = useState(false);
    const photoInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;

        const hash = window.location.hash;
        const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
        const queryString = hashQuery || window.location.search.replace(/^\?/, '');
        const params = queryString ? new URLSearchParams(queryString) : null;

        setObjetId(initialEquipmentId || params?.get('equipmentId') || null);
        setCran('Bon');
        setPhotos([]);
        setRefusPhoto(null);
        setCommentaire('');
        setRefus(null);
        setScanOuvert(false);
    }, [open, initialEquipmentId]);

    const objet = useMemo<Equipment | null>(
        () => equipment.find((item) => item.id === objetId) ?? null,
        [equipment, objetId],
    );

    /** Un objet en « retour à confirmer » se réceptionne ; un objet attribué se rend. */
    const reception = objet?.assignmentStatus === 'PENDING_RETURN';

    /**
     * *« L'IT du site »* — la table de 17.4 nomme l'autre partie d'une restitution. Le
     * modèle ne porte pas de rôle « informatique du site » : on prend l'administrateur
     * du site de l'objet, à défaut le premier administrateur. Sans aucun compte
     * administrateur, le bloc 2 disparaît plutôt que de nommer quelqu'un au hasard.
     */
    const informatique = useMemo<User | null>(() => {
        const administrateurs = users.filter(
            (person) =>
                (person.role === 'Admin' || person.role === 'SuperAdmin') &&
                person.status !== 'inactive',
        );
        return (
            administrateurs.find((person) => objet?.site && person.site === objet.site) ??
            administrateurs[0] ??
            null
        );
    }, [users, objet?.site]);

    /** Ce qui peut faire retour : ce qui est détenu, et ce qui attend d'être réceptionné. */
    const eligibles = useMemo(
        () =>
            equipment.filter(
                (item) => item.status === 'Attribué' || item.assignmentStatus === 'PENDING_RETURN',
            ),
        [equipment],
    );

    const objetsRetournables = useMemo<ActChoice[]>(
        () =>
            eligibles.map((item) => ({
                id: item.id,
                vignette: <Icon glyph={Laptop} size={20} />,
                /* Ceux qui attendent l'informatique passent devant : ils sont le geste
                       du jour, l'objet encore détenu ne l'est pas. */
                highlighted: item.assignmentStatus === 'PENDING_RETURN',
                title: item.name,
                subtitle: [
                    item.model || item.type,
                    item.user?.name ? `chez ${item.user.name}` : item.site,
                    item.assignmentStatus === 'PENDING_RETURN' ? 'retour à confirmer' : null,
                ]
                    .filter(Boolean)
                    .join(' · '),
                searchText: `${item.assetId} ${item.name} ${item.model} ${item.user?.name ?? ''}`,
            })),
        [eligibles],
    );

    const restituer = () => {
        if (!objet) return;

        const maintenant = new Date().toISOString();
        const decision = updateEquipment(
            objet.id,
            {
                ...getEquipmentUpdatesForReturnWorkflow({
                    phase: 'initiation',
                    actorId: actor?.id,
                    nowISO: maintenant,
                }),
                notes: `${objet.notes || ''}\n[DEMANDE RETOUR ${formatDate()}] ${commentaire.trim() || 'Aucun commentaire'}`,
            },
            {
                source: 'return_act_sheet',
                stage: 'initiation',
                comment: commentaire.trim() || undefined,
                requestedBy: actor?.id || 'system',
            },
        );

        if (!decision.allowed) {
            setRefus(decision.reason || 'Vous n’avez pas le droit de modifier cet équipement.');
            return;
        }

        showToast(`Restitution initiée : ${objet.name}`, 'success');
        onClose();
    };

    const receptionner = () => {
        if (!objet) return;

        const maintenant = new Date().toISOString();
        const decision = updateEquipment(
            objet.id,
            {
                ...getEquipmentUpdatesForReturnWorkflow({
                    phase: 'inspection',
                    condition: cran,
                    actorId: actor?.id,
                    nowISO: maintenant,
                }),
                operationalStatus: 'Actif',
                notes: `${objet.notes || ''}\n[INSPECTION RETOUR ${formatDate()}] État: ${cran}${commentaire ? ` - ${commentaire}` : ''}`,
            },
            {
                condition: cran,
                photos: photos.join(', ') || undefined,
                comment: commentaire.trim() || undefined,
                previousUser: objet.user?.name || null,
                source: 'return_act_sheet',
                stage: 'inspection',
            },
        );

        if (!decision.allowed) {
            setRefus(decision.reason || 'Vous n’avez pas le droit de modifier cet équipement.');
            return;
        }

        showToast(`Retour clôturé : ${objet.name}`, 'success');
        onClose();
    };

    const attester = (_method: AttestationMethod) => {
        setRefus(null);
        if (reception) receptionner();
        else restituer();
    };

    if (!open) return null;

    return (
        <>
            {scanOuvert && (
                <ActScanOverlay
                    eligibles={eligibles}
                    tip="Cadrez l’étiquette collée sur l’objet. Code-barres ou QR, le viseur s’ajuste seul."
                    acceptLabel="Choisir celui-ci"
                    onClose={() => setScanOuvert(false)}
                    onPick={setObjetId}
                />
            )}
            <ActSheet
                open
                onClose={onClose}
                title={reception ? 'Réceptionner le retour' : 'Restituer l’équipement'}
                subtitle={
                    reception
                        ? 'Vous constatez l’état dans lequel l’objet revient.'
                        : 'Vous attestez rendre l’objet. L’informatique constatera son état.'
                }
                subject={
                    objet
                        ? {
                              vignette: <Icon glyph={Laptop} size={20} />,
                              title: objet.name,
                              subtitle: [
                                  objet.model || objet.type,
                                  objet.user?.name
                                      ? reception
                                          ? `rendu par ${objet.user.name}`
                                          : `chez ${objet.user.name}`
                                      : objet.site,
                              ]
                                  .filter(Boolean)
                                  .join(' · '),
                          }
                        : null
                }
                subjectPicker={{
                    title: 'Retourner un équipement',
                    prompt: 'Lequel ?',
                    searchPlaceholder: 'Identifiant, modèle, porteur',
                    groupLabel: 'Attribués et retours à réceptionner',
                    onScan: () => setScanOuvert(true),
                    items: objetsRetournables,
                    onPick: setObjetId,
                    emptyLabel: 'Aucun équipement détenu ne correspond.',
                }}
                counterparty={
                    !reception && informatique
                        ? {
                              label: 'Rendu à',
                              vignette: <Icon glyph={Laptop} size={20} />,
                              title: informatique.name,
                              subtitle: ['Informatique', objet?.site || informatique.site]
                                  .filter(Boolean)
                                  .join(' · '),
                          }
                        : null
                }
                question={
                    reception
                        ? {
                              label: 'Ce qu’on voit',
                              children: (
                                  <div className="flex flex-col gap-4">
                                      <div>
                                          {/* Des carrés de 56 : la case d'une photo. */}
                                          <div className="flex flex-wrap gap-2">
                                              {photos.map((nom, index) => (
                                                  <ShotBox
                                                      key={`${nom}-${index}`}
                                                      glyph={Camera}
                                                      filled
                                                      title={nom}
                                                      aria-label={`Photo jointe : ${nom} — retirer`}
                                                      onClick={() =>
                                                          setPhotos((prev) =>
                                                              prev.filter(
                                                                  (_, position) =>
                                                                      position !== index,
                                                              ),
                                                          )
                                                      }
                                                  />
                                              ))}
                                              <ShotBox
                                                  glyph={Camera}
                                                  label="ajouter"
                                                  aria-label="Ajouter une photo du retour"
                                                  onClick={() => photoInput.current?.click()}
                                              />
                                              <FilePicker
                                                  ref={photoInput}
                                                  accept="image/*"
                                                  multiple
                                                  onFiles={(noms) => {
                                                      setRefusPhoto(null);
                                                      setPhotos((prev) =>
                                                          noms.length > 0
                                                              ? [...prev, ...noms]
                                                              : prev,
                                                      );
                                                  }}
                                                  onReject={setRefusPhoto}
                                              />
                                          </div>
                                          {/* Le refus se lit au champ, là où la photo a été
                                          choisie, et nomme le fichier et sa taille. */}
                                          {refusPhoto && (
                                              <p
                                                  className="text-error mt-2 flex items-start gap-1.5 text-[14px] leading-5"
                                                  role="alert"
                                              >
                                                  <Icon
                                                      glyph={XCircle}
                                                      size={18}
                                                      className="mt-px"
                                                  />
                                                  <span>{refusPhoto}</span>
                                              </p>
                                          )}
                                      </div>

                                      <div>
                                          <FieldLabel>Ce que l’objet devient</FieldLabel>
                                          <div className="flex flex-col gap-2">
                                              {CRANS.map((entry) => (
                                                  <OptionRow
                                                      key={entry.value}
                                                      title={entry.title}
                                                      hint={entry.hint}
                                                      tint={entry.tint}
                                                      selected={cran === entry.value}
                                                      onSelect={() => setCran(entry.value)}
                                                  />
                                              ))}
                                          </div>
                                      </div>

                                      <TextArea
                                          value={commentaire}
                                          onChange={(event) => setCommentaire(event.target.value)}
                                          rows={3}
                                          aria-label="Décrire l’état du matériel"
                                          placeholder="Décrire, si la photo ne suffit pas."
                                      />
                                  </div>
                              ),
                          }
                        : {
                              label: 'Un mot sur l’état',
                              children: (
                                  <TextArea
                                      value={commentaire}
                                      onChange={(event) => setCommentaire(event.target.value)}
                                      rows={3}
                                      aria-label="Un mot sur l’état de l’équipement"
                                      placeholder="Ce qu’il faut savoir, s’il y a quelque chose."
                                  />
                              ),
                          }
                }
                signer={{ name: actor?.name ?? '', pin: actor?.pin }}
                consequence={
                    reception
                        ? CONSEQUENCE[cran]
                        : {
                              tone: 'ambre',
                              glyph: Hourglass,
                              text: (
                                  <>
                                      L’objet passe <strong>en retour à confirmer</strong> : vous
                                      n’en répondez plus, il ne redevient pas disponible pour
                                      autant.
                                  </>
                              ),
                          }
                }
                confirmLabel={reception ? 'Réceptionner' : 'Je rends'}
                /* Une réception attend déjà dans la file : la refermer, c'est « Plus tard ». */
                cancelLabel={reception ? 'Plus tard' : 'Annuler'}
                onConfirm={attester}
                error={refus}
            />
        </>
    );
};

export default ReturnActSheet;
