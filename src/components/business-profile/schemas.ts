import { z } from 'zod';

const digitsOnly = (len: number) =>
  z.string().regex(new RegExp(`^\\d{${len}}$`), `Введите ровно ${len} цифр`);

const oooFields = z.object({
  legalType: z.literal('ooo'),
  inn: digitsOnly(10),
  consent: z.literal(true, { errorMap: () => ({ message: 'Необходимо дать согласие' }) }),
});

const ipFields = z.object({
  legalType: z.literal('ip'),
  inn: digitsOnly(12),
  address: z.string().min(1, 'Обязательное поле'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Необходимо дать согласие' }) }),
});

const selfEmployedFields = z.object({
  legalType: z.literal('selfemployed'),
  inn: digitsOnly(12),
  address: z.string().min(1, 'Обязательное поле'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Необходимо дать согласие' }) }),
});

export const registrationSchema = z.discriminatedUnion('legalType', [
  oooFields,
  ipFields,
  selfEmployedFields,
]);

export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type LegalType = RegistrationFormData['legalType'];

// Keep old exports for compatibility
export const oooSchema = oooFields;
export const ipSchema = ipFields;
export const selfEmployedSchema = selfEmployedFields;
export type OooFormData = z.infer<typeof oooFields>;
export type IpFormData = z.infer<typeof ipFields>;
export type SelfEmployedFormData = z.infer<typeof selfEmployedFields>;
