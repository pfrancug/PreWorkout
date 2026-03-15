import i18next from 'i18next';
import { z } from 'zod';

export const addEventSchema = z
  .object({
    activityId: z.string().optional(),
    name: z.string().max(100).optional(),
    saveToActivities: z.boolean(),
    icon: z.string(),
    color: z.string(),
    allDay: z.boolean(),
    time: z.string().optional(),
    timeEnd: z.string().optional(),
    note: z.string().max(500).optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.activityId && !d.name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18next.t('calendar.validation.selectActivityOrName'),
        path: ['activityId'],
      });
    }
    if (!d.allDay && (!d.time || !d.timeEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18next.t('calendar.validation.addStartEndTime'),
        path: ['time'],
      });
    }
  });

export type AddEventFormData = z.infer<typeof addEventSchema>;

export const editEntrySchema = z
  .object({
    note: z.string().max(500),
    time: z.string().optional(),
    timeEnd: z.string().optional(),
    allDay: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (!d.allDay && (!d.time || !d.timeEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18next.t('calendar.validation.addStartEndTime'),
        path: ['time'],
      });
    }
  });

export type EditEntryFormData = z.infer<typeof editEntrySchema>;

export const noteSchema = z.object({
  note: z.string().max(1000),
});

export type NoteFormData = z.infer<typeof noteSchema>;
