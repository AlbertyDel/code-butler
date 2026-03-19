import { z } from 'zod';

const digitsOnly = (len: number) =>
  z.string().regex(new RegExp(`^\\d{${len}}$`), `Введите ровно ${len} цифр`);

const oooFields = z.object({
  legalType: z.literal('ooo'),
  inn: digitsOnly(10),
  companyName: z.string().optional(),
  kpp: z.string().optional(),
  ogrn: z.string().optional(),
  account: digitsOnly(20),
  bik: digitsOnly(9),
});

const ipFields = z.object({
  legalType: z.literal('ip'),
  inn: digitsOnly(12),
  fullName: z.string().min(1, 'Обязательное поле'),
  account: digitsOnly(20),
  bik: digitsOnly(9),
});

const selfEmployedFields = z.object({
  legalType: z.literal('selfemployed'),
  inn: digitsOnly(12),
  fullName: z.string().min(1, 'Обязательное поле'),
  passportSeries: digitsOnly(4),
  passportNumber: digitsOnly(6),
  passportIssuedBy: z.string().min(1, 'Обязательное поле'),
  passportDate: z.string().min(1, 'Обязательное поле'),
  passportCode: z.string().min(1, 'Обязательное поле').regex(/^\d{3}-\d{3}$/, 'Формат: XXX-XXX'),
  address: z.string().min(1, 'Обязательное поле'),
  account: digitsOnly(20),
  bik: digitsOnly(9),
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
