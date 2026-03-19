import { z } from 'zod';

const digitsOnly = (len: number) =>
  z.string().regex(new RegExp(`^\\d{${len}}$`), `Введите ровно ${len} цифр`);

const oooFields = z.object({
  legalType: z.literal('ooo'),
  inn: digitsOnly(10),
  agreed: z.literal(true, { errorMap: () => ({ message: 'Необходимо дать согласие' }) }),
});

const ipFields = z.object({
  legalType: z.literal('ip'),
  inn: digitsOnly(12),
  address: z.string().min(1, 'Обязательное поле'),
  agreed: z.literal(true, { errorMap: () => ({ message: 'Необходимо дать согласие' }) }),
});

const selfEmployedFields = z.object({
  legalType: z.literal('selfemployed'),
  inn: digitsOnly(12),
  address: z.string().min(1, 'Обязательное поле'),
  agreed: z.literal(true, { errorMap: () => ({ message: 'Необходимо дать согласие' }) }),
});

export const registrationSchema = z.discriminatedUnion('legalType', [
  oooFields,
  ipFields,
  selfEmployedFields,
]);

export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type LegalType = RegistrationFormData['legalType'];
