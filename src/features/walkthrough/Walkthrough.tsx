import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconTile, Surface } from '@/ui';
import { border, colors, offset as offsets, radius, spacing, type } from '@/theme';

type Step = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  body: string;
};

/**
 * What a first-time user cannot work out by looking. Two things on this list
 * are reachable only from an icon in the home header — the timetable and the
 * daily check-in — and the check-in is the whole point of the app, so both
 * get a step naming where they live.
 */
export const STEPS: readonly Step[] = [
  {
    icon: 'folder-open',
    color: colors.blue,
    title: 'A folder for every subject',
    body:
      'Start by adding what you are taking this term, with the field at the top of the home screen. Deadlines, tasks and documents all live inside the subject they belong to.',
  },
  {
    icon: 'alarm',
    color: colors.pink,
    title: 'Deadlines you can see coming',
    body:
      'Add assignments, quizzes and exams with the date they are due. Unibud sorts them by what comes first, flags anything overdue, and reminds you a set number of hours ahead.',
  },
  {
    icon: 'checkmark-done',
    color: colors.lime,
    title: 'Tasks know their subject',
    body:
      'A task added to a subject appears both there and in the combined Todo list. Reminders that belong to no subject — a form to hand in, someone to go and see — live on the Deadlines tab.',
  },
  {
    icon: 'calendar',
    color: '#FF8A5B',
    title: 'Your week, class by class',
    body:
      'Put your class times in once, using the calendar icon at the top right of the home screen. Your timetable then sits beside everything else you owe.',
  },
  {
    icon: 'notifications',
    color: '#8B7BF7',
    title: 'One question a day',
    body:
      'At a time you pick, Unibud sends a single notification asking what is due. Set it under the gear icon at the top left. This is the part that stops work being remembered the night before.',
  },
  {
    icon: 'lock-closed',
    color: '#33D6C0',
    title: 'Nothing leaves your phone',
    body:
      'There is no account and no server. Everything you add is stored on this device only, and the app works with the plane mode on. You can reopen this walkthrough any time from Settings.',
  },
];

/**
 * The first-run tour, also replayable from Settings. `onDone` fires for both
 * finishing and skipping — a user who skips has still been offered it, and
 * being shown it again on the next launch would read as a bug.
 */
export function Walkthrough({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);

  // Reopening from Settings has to start at the beginning, and the component
  // stays mounted between showings, so the index is reset on the way in.
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android's back button should dismiss rather than trap the user.
      onRequestClose={onDone}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <Surface r={radius.lg} depth={offsets.md} style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.head}>
              <Text style={styles.counter}>
                {String(index + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onDone}
                hitSlop={10}
                style={({ pressed }) => (pressed ? styles.pressed : null)}
              >
                <Text style={styles.skip}>{last ? 'Close' : 'Skip'}</Text>
              </Pressable>
            </View>

            <IconTile icon={step.icon} color={step.color} size={58} />

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.body}>{step.body}</Text>

            <View style={styles.dots}>
              {STEPS.map((s, i) => (
                <View
                  key={s.title}
                  style={[styles.dot, i <= index ? styles.dotOn : null]}
                />
              ))}
            </View>

            <View style={styles.actions}>
              {index > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIndex(index - 1)}
                  style={({ pressed }) => [
                    styles.backBtn,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Ionicons name="arrow-back" size={18} color={colors.ink} />
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => (last ? onDone() : setIndex(index + 1))}
                style={({ pressed }) => [
                  styles.nextWrap,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Surface fill={colors.ink} r={radius.md} depth={offsets.sm}>
                  <View style={styles.next}>
                    <Text style={styles.nextLabel}>
                      {last ? 'Start using Unibud' : 'Next'}
                    </Text>
                    <View style={styles.nextSquare}>
                      <Ionicons
                        name={last ? 'checkmark' : 'arrow-forward'}
                        size={14}
                        color={colors.ink}
                      />
                    </View>
                  </View>
                </Surface>
              </Pressable>
            </View>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 22, 27, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  // Margins belong on the wrapper: put them on the face and they pad the
  // wrapper instead, thickening the drawn shadow by the same amount.
  cardWrap: { maxWidth: 420, width: '100%', alignSelf: 'center' },
  card: { padding: spacing.xl, gap: spacing.lg },

  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { ...type.caption, color: colors.faint, fontWeight: '800', letterSpacing: 1 },
  skip: { ...type.label, color: colors.muted, fontWeight: '700' },

  title: { ...type.title, color: colors.ink },
  body: { ...type.body, color: colors.muted, lineHeight: 22 },

  dots: { flexDirection: 'row', gap: spacing.xs + 2 },
  dot: {
    width: 18,
    height: 6,
    borderRadius: 3,
    borderWidth: border.width,
    borderColor: border.color,
    backgroundColor: colors.surface,
  },
  dotOn: { backgroundColor: colors.lime },

  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: border.width,
    borderColor: border.color,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextWrap: { flex: 1, minWidth: 0 },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  nextLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.onInk,
  },
  nextSquare: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: { opacity: 0.6 },
});
