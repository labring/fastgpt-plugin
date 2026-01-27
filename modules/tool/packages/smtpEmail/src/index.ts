import { getErrText } from '@tool/utils/err';
import { z } from 'zod';
import nodemailer from 'nodemailer';

export const InputType = z
  .object({
    smtpHost: z.string(),
    smtpPort: z.string(),
    SSL: z.union([z.enum(['true', 'false', '']), z.boolean()]).optional(),
    smtpUser: z.string(),
    smtpPass: z.string(),
    fromName: z.string().optional(),
    to: z.string().refine(
      (val) =>
        val
          .split(',')
          .map((email) => email.trim())
          .every((email) => z.string().email().safeParse(email).success),
      { message: 'to should be a comma-separated list of valid emails' }
    ),
    subject: z.string(),
    content: z.string(),
    cc: z
      .string()
      .refine(
        (val) =>
          val === undefined ||
          val === '' ||
          val
            .split(',')
            .map((email) => email.trim())
            .every((email) => z.string().email().safeParse(email).success),
        { message: 'cc should be a comma-separated list of valid emails if provided' }
      )
      .optional(),
    bcc: z
      .string()
      .refine(
        (val) =>
          val === undefined ||
          val === '' ||
          val
            .split(',')
            .map((email) => email.trim())
            .every((email) => z.string().email().safeParse(email).success),
        { message: 'bcc should be a comma-separated list of valid emails if provided' }
      )
      .optional(),
    attachments: z.string().optional()
  })
  .transform((data) => {
    return {
      ...data,
      SSL: data.SSL === 'true' || data.SSL === true
    };
  });

export const OutputType = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  error: z.string().optional()
});

export async function tool({
  smtpHost,
  smtpPort,
  SSL,
  smtpUser,
  smtpPass,
  fromName,
  to,
  subject,
  content,
  cc,
  bcc,
  attachments
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: SSL,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  try {
    const attachmentsArray = (() => {
      try {
        return JSON.parse(attachments || '[]');
      } catch {
        throw new Error('Attachment format parsing error, please check attachment configuration');
      }
    })();
    // 发送邮件
    const info = await transporter.sendMail({
      from: `"${fromName || 'FastGPT'}" <${smtpUser}>`,
      to: to
        .split(',')
        .map((email) => email.trim())
        .join(','),
      cc: cc
        ?.split(',')
        .map((email) => email.trim())
        .join(','),
      bcc: bcc
        ?.split(',')
        .map((email) => email.trim())
        .join(','),
      subject,
      html: content,
      attachments: attachmentsArray || []
    });
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error: any) {
    return {
      success: false,
      error: getErrText(error)
    };
  }
}
