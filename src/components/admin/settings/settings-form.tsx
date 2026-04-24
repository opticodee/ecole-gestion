'use client';

import { useState } from 'react';
import { Image as ImageIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { updateSchool, type SchoolData } from '@/server/actions/school';
import { TIME_SLOT_LABELS } from '@/lib/time-slots';
import type { SchoolSettings } from '@/lib/validators/school';

const PERIOD_OPTIONS: { value: SchoolSettings['defaultPeriodType']; label: string }[] = [
  { value: 'TRIMESTRE', label: 'Trimestre' },
  { value: 'SEMESTRE', label: 'Semestre' },
  { value: 'BIMESTRE', label: 'Bimestre' },
];

const TIME_SLOT_KEYS = [
  'MERCREDI_PM',
  'SAMEDI_AM',
  'SAMEDI_PM',
  'DIMANCHE_AM',
  'DIMANCHE_PM',
] as const;

export function SettingsForm({ school }: { school: SchoolData }) {
  const [name, setName] = useState(school.name);
  const [description, setDescription] = useState(school.description);
  const [address, setAddress] = useState(school.address);
  const [phone, setPhone] = useState(school.phone);
  const [contactEmail, setContactEmail] = useState(school.contactEmail);
  const [website, setWebsite] = useState(school.website);
  const [settings, setSettings] = useState<SchoolSettings>(school.settings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateSlot(
    key: (typeof TIME_SLOT_KEYS)[number],
    patch: Partial<SchoolSettings['timeSlotConfig'][typeof key]>,
  ) {
    setSettings((s) => ({
      ...s,
      timeSlotConfig: {
        ...s.timeSlotConfig,
        [key]: { ...s.timeSlotConfig[key], ...patch },
      },
    }));
  }

  function updateMention(
    key: keyof SchoolSettings['mentionThresholds'],
    value: number,
  ) {
    setSettings((s) => ({
      ...s,
      mentionThresholds: { ...s.mentionThresholds, [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await updateSchool({
      name: name.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      website: website.trim() || undefined,
      settings,
    });

    setLoading(false);
    if ('error' in result && result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success('Paramètres enregistrés avec succès.');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1 — Informations de l'école */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Informations de l&apos;école</CardTitle>
          <CardDescription>
            Coordonnées et identité de l&apos;établissement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="school-name">Nom de l&apos;école *</Label>
            <Input
              id="school-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ACMSCHOOL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="school-description">Description</Label>
            <textarea
              id="school-description"
              className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brève description de l'école"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="school-address">Adresse</Label>
            <textarea
              id="school-address"
              className="min-h-16 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 rue des Lilas, 75020 Paris"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="school-phone">Téléphone</Label>
              <Input
                id="school-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school-contact-email">Email de contact</Label>
              <Input
                id="school-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@ecole.fr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="school-website">Site web</Label>
            <Input
              id="school-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://ecole.fr"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <p className="text-sm">Bientôt disponible</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Configuration pédagogique */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Configuration pédagogique</CardTitle>
          <CardDescription>
            Valeurs par défaut utilisées dans les formulaires et les calculs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-scale">Échelle de notation par défaut</Label>
              <Input
                id="default-scale"
                type="number"
                min={5}
                max={100}
                value={settings.defaultScale}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    defaultScale: Number(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Ex : 10 pour une notation /10, 20 pour une notation /20.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="absence-threshold">Seuil d&apos;alerte absences</Label>
              <Input
                id="absence-threshold"
                type="number"
                min={1}
                max={50}
                value={settings.absenceThreshold}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    absenceThreshold: Number(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Nombre d&apos;absences non justifiées avant alerte.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="late-to-absent">
                Retard transformé en absence (minutes)
              </Label>
              <Input
                id="late-to-absent"
                type="number"
                min={1}
                max={120}
                value={settings.lateToAbsentMinutes}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    lateToAbsentMinutes: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-type">Type de période par défaut</Label>
              <select
                id="period-type"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={settings.defaultPeriodType}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    defaultPeriodType: e.target
                      .value as SchoolSettings['defaultPeriodType'],
                  }))
                }
              >
                {PERIOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Créneaux horaires */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Créneaux horaires</CardTitle>
          <CardDescription>
            Les 5 demi-journées possibles. Désactivez un créneau pour le retirer
            de l&apos;emploi du temps.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-primary/5">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Créneau</th>
                  <th className="px-3 py-2 text-left font-medium">Début</th>
                  <th className="px-3 py-2 text-left font-medium">Fin</th>
                  <th className="px-3 py-2 text-center font-medium">Actif</th>
                </tr>
              </thead>
              <tbody>
                {TIME_SLOT_KEYS.map((key) => {
                  const slot = settings.timeSlotConfig[key];
                  return (
                    <tr key={key} className="border-t">
                      <td className="px-3 py-2 font-medium">
                        {TIME_SLOT_LABELS[key]}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateSlot(key, { startTime: e.target.value })
                          }
                          className="w-28"
                          disabled={!slot.enabled}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateSlot(key, { endTime: e.target.value })
                          }
                          className="w-28"
                          disabled={!slot.enabled}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <label className="inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={slot.enabled}
                            onChange={(e) =>
                              updateSlot(key, { enabled: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-input"
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Mentions */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Seuils de mention</CardTitle>
          <CardDescription>
            Mentions attribuées selon la moyenne générale (sur 10).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-primary/5">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Mention</th>
                  <th className="px-3 py-2 text-left font-medium">Seuil (≥)</th>
                </tr>
              </thead>
              <tbody>
                <MentionRow
                  label="Excellent"
                  value={settings.mentionThresholds.excellent}
                  onChange={(v) => updateMention('excellent', v)}
                />
                <MentionRow
                  label="Très bien"
                  value={settings.mentionThresholds.tresBien}
                  onChange={(v) => updateMention('tresBien', v)}
                />
                <MentionRow
                  label="Bien"
                  value={settings.mentionThresholds.bien}
                  onChange={(v) => updateMention('bien', v)}
                />
                <MentionRow
                  label="Passable"
                  value={settings.mentionThresholds.passable}
                  onChange={(v) => updateMention('passable', v)}
                />
                <tr className="border-t bg-muted/30">
                  <td className="px-3 py-2 font-medium">Insuffisant</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    &lt; {settings.mentionThresholds.passable}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Les seuils doivent être décroissants : Excellent ≥ Très bien ≥ Bien ≥
            Passable.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}

function MentionRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <tr className="border-t">
      <td className="px-3 py-2 font-medium">{label}</td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-24"
        />
      </td>
    </tr>
  );
}
