import { z } from 'zod';

const digitsOnly = (len: number, label: string) =>
  z.string().regex(new RegExp(`^\\d{${len}}$`), `Введите ровно ${len} цифр`);

export const oooSchema = z.object({
  inn: digitsOnly(10, 'ИНН'),
  companyName: z.string().optional(),
  kpp: z.string().optional(),
  ogrn: z.string().optional(),
  account: digitsOnly(20, 'Расчётный счёт'),
  bik: digitsOnly(9, 'БИК'),
});

export const ipSchema = z.object({
  inn: digitsOnly(12, 'ИНН'),
  fullName: z.string().min(1, 'Обязательное поле'),
  account: digitsOnly(20, 'Расчётный счёт'),
  bik: digitsOnly(9, 'БИК'),
});

export const selfEmployedSchema = z.object({
  inn: digitsOnly(12, 'ИНН'),
  fullName: z.string().min(1, 'Обязательное поле'),
  passportSeries: digitsOnly(4, 'Серия паспорта'),
  passportNumber: digitsOnly(6, 'Номер паспорта'),
  passportIssuedBy: z.string().min(1, 'Обязательное поле'),
  passportDate: z.string().min(1, 'Обязательное поле'),
  passportCode: z.string().min(1, 'Обязательное поле').regex(/^\d{3}-\d{3}$/, 'Формат: XXX-XXX'),
  address: z.string().min(1, 'Обязательное поле'),
  account: digitsOnly(20, 'Расчётный счёт'),
  bik: digitsOnly(9, 'БИК'),
});

export type OooFormData = z.infer<typeof oooSchema>;
export type IpFormData = z.infer<typeof ipSchema>;
export type SelfEmployedFormData = z.infer<typeof selfEmployedSchema>;
