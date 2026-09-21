import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Field, ScreenTitle, SectionHeader } from '@/components/ui';
import {
  DEFAULTS,
  getBoolSetting,
  getNumberSetting,
  getSetting,
  KEYS,
  setSetting,
} from '@/db/settings';
import { clockToMinutes, minutesToClock } from '@/lib/format';
import { cancel, ensurePermissions, scheduleDailyPrompt } from '@/lib/notifications';
import { colors, radius, spacing } from '@/theme';

/**
 * "asks daily for your deadlines and assignments" — the one recurring
 * notification, plus how far ahead deadline reminders fire.
 */
export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [enabled, setEnabled] = useState<boolean>(DEFAULTS.dailyPromptEnabled);
  const [time, setTime] = useState(
    minutesToClock(DEFAULTS.dailyPromptHour * 60 + DEFAULTS.dailyPromptMinute)
  );
  const [lead, setLead] = useState(String(DEFAULTS.reminderLeadHours));
  const [status, setStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [on, hour, minute, leadHours] = await Promise.all([
        getBoolSetting(db, KEYS.dailyPromptEnabled, DEFAULTS.dailyPromptEnabled),
        getNumberSetting(db, KEYS.dailyPromptHour, DEFAULTS.dailyPromptHour),
        getNumberSetting(db, KEYS.dailyPromptMinute, DEFAULTS.dailyPromptMinute),
        getNumberSetting(db, KEYS.reminderLeadHours, DEFAULTS.reminderLeadHours),
      ]);
      setEnabled(on);
      setTime(minutesToClock(hour * 60 + minute));
      setLead(String(leadHours));
      setLoaded(true);
    }
    void load();
  }, [db]);

  const minutes = clockToMinutes(time);
  const leadHours = Number(lead);
  const leadValid = Number.isFinite(leadHours) && leadHours > 0 && leadHours <= 336;
  const canSave = loaded && minutes != null && leadValid;

  async function onSave() {
    if (minutes == null || !leadValid) return;
    setStatus(null);

    // Replace any prompt scheduled earlier, so turning the switch on and off
    // cannot leave two notifications firing.
    await cancel(await getSetting(db, KEYS.dailyPromptId));
    await setSetting(db, KEYS.dailyPromptId, '');

    await setSetting(db, KEYS.dailyPromptEnabled, enabled ? '1' : '0');
    await setSetting(db, KEYS.dailyPromptHour, String(Math.floor(minutes / 60)));
    await setSetting(db, KEYS.dailyPromptMinute, String(minutes % 60));
    await setSetting(db, KEYS.reminderLeadHours, String(leadHours));

    if (!enabled) {
      setStatus('Daily check-in turned off.');
      return;
    }

    const granted = await ensurePermissions();
    if (!granted) {
      setStatus(
        'Notifications are turned off for Unibud. Enable them in system settings to get the daily check-in.'
      );
      return;
    }

    const id = await scheduleDailyPrompt(
      Math.floor(minutes / 60),
      minutes % 60
    );
    if (id) {
      await setSetting(db, KEYS.dailyPromptId, id);
      setStatus(`Unibud will ask you at ${minutesToClock(minutes)} every day.`);
    } else {
      setStatus('Could not schedule the daily check-in on this device.');
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTitle
        title="Daily check-in"
        subtitle="Unibud asks once a day what is due"
      />

      <Card>
        <View style={styles.row}>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Ask me daily</Text>
            <Text style={styles.rowMeta}>
              A single notification, at the time you choose.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ true: colors.accent, false: colors.line }}
          />
        </View>
      </Card>

      <SectionHeader>Time</SectionHeader>
      <Field
        value={time}
        onChangeText={setTime}
        placeholder="19:00"
        keyboardType="numbers-and-punctuation"
      />
      {minutes == null ? (
        <Text style={styles.hint}>Use a 24-hour time, like 19:00.</Text>
      ) : null}

      <SectionHeader>Deadline reminders</SectionHeader>
      <Text style={styles.body}>
        How many hours before a deadline Unibud should remind you. Applies to
        deadlines added from now on.
      </Text>
      <Field
        value={lead}
        onChangeText={setLead}
        placeholder="24"
        keyboardType="number-pad"
      />
      {!leadValid ? (
        <Text style={styles.hint}>Enter a number of hours between 1 and 336.</Text>
      ) : null}

      <View style={styles.save}>
        <Button label="Save" onPress={onSave} disabled={!canSave} />
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  body: { fontSize: 14, color: colors.muted, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.warning, marginTop: spacing.xs },
  save: { marginTop: spacing.xl },
  status: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.ink,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
});
