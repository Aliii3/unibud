import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  Loading,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import { createSlot, deleteSlot, listSlotsForWeek } from '@/db/schedule';
import { listSubjects, type SubjectSummary } from '@/db/subjects';
import { clockToMinutes, minutesToClock, WEEKDAYS, WEEKDAYS_SHORT } from '@/lib/format';
import { useQuery } from '@/lib/useQuery';
import { colors, radius, shadow, spacing } from '@/theme';

/** "add your subjects and schedule" — the weekly timetable. */
export default function ScheduleScreen() {
  const db = useSQLiteContext();
  const { data, loading, refresh } = useQuery(listSlotsForWeek);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [subjectId, setSubjectId] = useState<number | undefined>();
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    listSubjects(db).then((rows) => {
      setSubjects(rows);
      setSubjectId((current) => current ?? rows[0]?.id);
    });
  }, [db]);

  const slots = data ?? [];
  const startMin = clockToMinutes(start);
  const endMin = clockToMinutes(end);
  const timesInvalid =
    startMin != null && endMin != null && endMin <= startMin;
  const canSave =
    subjectId != null && startMin != null && endMin != null && !timesInvalid;

  async function onAdd() {
    if (subjectId == null || startMin == null || endMin == null) return;
    await createSlot(db, {
      subject_id: subjectId,
      weekday,
      start_min: startMin,
      end_min: endMin,
      location: location.trim() || null,
    });
    setStart('');
    setEnd('');
    setLocation('');
    refresh();
  }

  if (subjects.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="folder-open-outline"
          title="Add a subject first"
          body="A class slot belongs to a subject, so create one on Home before building your timetable."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTitle title={'Your week,\nclass by class.'} />

      <View style={styles.form}>
        <View style={styles.chips}>
          {subjects.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              color={s.color}
              selected={subjectId === s.id}
              onPress={() => setSubjectId(s.id)}
            />
          ))}
        </View>

        <View style={styles.chips}>
          {WEEKDAYS_SHORT.map((day, index) => (
            <Chip
              key={day}
              label={day}
              selected={weekday === index}
              onPress={() => setWeekday(index)}
            />
          ))}
        </View>

        <View style={styles.times}>
          <Field
            style={styles.time}
            value={start}
            onChangeText={setStart}
            placeholder="09:00"
            keyboardType="numbers-and-punctuation"
          />
          <Field
            style={styles.time}
            value={end}
            onChangeText={setEnd}
            placeholder="10:30"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        {timesInvalid ? (
          <Text style={styles.hint}>The class has to end after it starts.</Text>
        ) : null}

        <Field
          value={location}
          onChangeText={setLocation}
          placeholder="Room (optional)"
        />
        <Button label="Add class" icon="add" onPress={onAdd} disabled={!canSave} />
      </View>

      {loading && slots.length === 0 ? <Loading /> : null}

      {WEEKDAYS.map((day, index) => {
        const daySlots = slots.filter((slot) => slot.weekday === index);
        if (daySlots.length === 0) return null;
        return (
          <View key={day}>
            <SectionHeader>{day}</SectionHeader>
            {daySlots.map((slot) => (
              <Card key={slot.id} accent={slot.subject_color}>
                <View style={styles.row}>
                  <Text style={styles.time_}>
                    {minutesToClock(slot.start_min)}
                  </Text>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{slot.subject_name}</Text>
                    <Text style={styles.rowMeta}>
                      {minutesToClock(slot.start_min)}–{minutesToClock(slot.end_min)}
                      {slot.location ? ` · ${slot.location}` : ''}
                    </Text>
                  </View>
                  <IconButton
                    icon="trash-outline"
                    label={`Delete ${slot.subject_name} class`}
                    onPress={async () => {
                      await deleteSlot(db, slot.id);
                      refresh();
                    }}
                  />
                </View>
              </Card>
            ))}
          </View>
        );
      })}

      {!loading && slots.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No classes yet"
          body="Add your weekly class times so Unibud knows your week."
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  times: { flexDirection: 'row', gap: spacing.sm },
  // minWidth lets the two inputs actually share the row instead of the
  // second one overflowing its card.
  time: { flex: 1, minWidth: 0 },
  hint: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  rowMeta: { fontSize: 12, color: colors.muted, marginTop: 2, fontWeight: '500' },
  time_: { fontSize: 13, fontWeight: '800', color: colors.ink, width: 48 },
});
