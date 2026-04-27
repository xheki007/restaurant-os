import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";

type NotificationChannel = "SMS" | "WHATSAPP" | "EMAIL";

type NotificationSendResult = {
  ok: boolean;
  providerMode: string;
  channel: NotificationChannel;
  to: string;
  template: string;
  variables: Record<string, unknown>;
  sentAt: string;
  providerResponse?: unknown;
  skipped?: boolean;
  reason?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private getEnv(name: string): string {
    return String(process.env[name] || "").trim();
  }

  private buildStubResult(params: {
    channel: NotificationChannel;
    to: string;
    template: string;
    variables?: Record<string, unknown>;
    reason?: string;
  }): NotificationSendResult {
    return {
      ok: true,
      providerMode: "stub",
      channel: params.channel,
      to: params.to,
      template: params.template,
      variables: params.variables ?? {},
      sentAt: new Date().toISOString(),
      ...(params.reason ? { reason: params.reason } : {}),
    };
  }

  private htmlEscape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private textToHtml(value: string): string {
    return this.htmlEscape(value).replace(/\n/g, "<br />");
  }

  private async sendEmailWithSmtp(params: {
    to: string;
    template: string;
    variables: Record<string, unknown>;
  }): Promise<NotificationSendResult> {
    const host = this.getEnv("SMTP_HOST");
    const port = Number(this.getEnv("SMTP_PORT") || 465);
    const secure = this.getEnv("SMTP_SECURE").toLowerCase() !== "false";
    const user = this.getEnv("SMTP_USER");
    const pass = this.getEnv("SMTP_PASS");
    const fromEmail = this.getEnv("SMTP_FROM_EMAIL") || user;
    const fromName = this.getEnv("SMTP_FROM_NAME") || "Restaurant";

    if (!host) {
      throw new Error("SMTP_HOST missing");
    }

    if (!user) {
      throw new Error("SMTP_USER missing");
    }

    if (!pass) {
      throw new Error("SMTP_PASS missing");
    }

    const subject = String(
      params.variables.subject ||
        params.variables.title ||
        "Restaurant notification",
    );

    const body = String(
      params.variables.body ||
        params.variables.message ||
        JSON.stringify(params.variables, null, 2),
    );

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const providerResponse = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: params.to,
      subject,
      text: body,
      html: this.textToHtml(body),
    });

    return {
      ok: true,
      providerMode: "smtp",
      channel: "EMAIL",
      to: params.to,
      template: params.template,
      variables: params.variables,
      sentAt: new Date().toISOString(),
      providerResponse,
    };
  }
  private async sendEmailWithResend(params: {
    to: string;
    template: string;
    variables: Record<string, unknown>;
  }): Promise<NotificationSendResult> {
    const apiKey = this.getEnv("RESEND_API_KEY");
    const fromEmail = this.getEnv("RESEND_FROM_EMAIL");
    const fromName = this.getEnv("RESEND_FROM_NAME") || "Restaurant";

    if (!apiKey) {
      throw new Error("RESEND_API_KEY missing");
    }

    if (!fromEmail) {
      throw new Error("RESEND_FROM_EMAIL missing");
    }

    const subject = String(
      params.variables.subject ||
        params.variables.title ||
        "Restaurant notification",
    );

    const body = String(
      params.variables.body ||
        params.variables.message ||
        JSON.stringify(params.variables, null, 2),
    );

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [params.to],
        subject,
        text: body,
        html: this.textToHtml(body),
      }),
    });

    const responseText = await response.text();
    let providerResponse: unknown = responseText;

    try {
      providerResponse = responseText ? JSON.parse(responseText) : {};
    } catch {
      providerResponse = responseText;
    }

    if (!response.ok) {
      throw new Error(
        `Resend email failed (${response.status}): ${responseText}`,
      );
    }

    return {
      ok: true,
      providerMode: "resend",
      channel: "EMAIL",
      to: params.to,
      template: params.template,
      variables: params.variables,
      sentAt: new Date().toISOString(),
      providerResponse,
    };
  }

  private async sendWhatsAppWithMeta(params: {
    to: string;
    template: string;
    variables: Record<string, unknown>;
  }): Promise<NotificationSendResult> {
    const accessToken = this.getEnv("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = this.getEnv("WHATSAPP_PHONE_NUMBER_ID");
    const graphVersion = this.getEnv("WHATSAPP_GRAPH_VERSION") || "v23.0";
    const templateName =
      this.getEnv("WHATSAPP_REVIEW_TEMPLATE_NAME") ||
      params.template ||
      "review_request_whatsapp";
    const languageCode = this.getEnv("WHATSAPP_TEMPLATE_LANGUAGE") || "en";

    if (!accessToken) {
      throw new Error("WHATSAPP_ACCESS_TOKEN missing");
    }

    if (!phoneNumberId) {
      throw new Error("WHATSAPP_PHONE_NUMBER_ID missing");
    }

    const guestName = String(params.variables.guestName || "Guest");
    const restaurantName = String(params.variables.restaurantName || "Restaurant");
    const reviewLink = String(params.variables.reviewLink || "");
    const privateFeedbackLink = String(params.variables.privateFeedbackLink || "");

    if (!reviewLink) {
      throw new Error("reviewLink missing for WhatsApp review request");
    }

    const templateParameters = [
      {
        type: "text",
        text: guestName,
      },
      {
        type: "text",
        text: restaurantName,
      },
      {
        type: "text",
        text: reviewLink,
      },
    ];

    if (privateFeedbackLink) {
      templateParameters.push({
        type: "text",
        text: privateFeedbackLink,
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.to,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: languageCode,
            },
            components: [
              {
                type: "body",
                parameters: templateParameters,
              },
            ],
          },
        }),
      },
    );

    const responseText = await response.text();
    let providerResponse: unknown = responseText;

    try {
      providerResponse = responseText ? JSON.parse(responseText) : {};
    } catch {
      providerResponse = responseText;
    }

    if (!response.ok) {
      throw new Error(
        `Meta WhatsApp failed (${response.status}): ${responseText}`,
      );
    }

    return {
      ok: true,
      providerMode: "meta-whatsapp",
      channel: "WHATSAPP",
      to: params.to,
      template: templateName,
      variables: params.variables,
      sentAt: new Date().toISOString(),
      providerResponse,
    };
  }

  async send(params: {
    channel: NotificationChannel;
    to: string;
    template: string;
    variables?: Record<string, unknown>;
  }) {
    const variables = params.variables ?? {};
    const emailProvider = this.getEnv("EMAIL_PROVIDER").toLowerCase();
    const whatsappProvider = this.getEnv("WHATSAPP_PROVIDER").toLowerCase();

    let result: NotificationSendResult;

    if (params.channel === "EMAIL" && emailProvider === "smtp") {
      result = await this.sendEmailWithSmtp({
        to: params.to,
        template: params.template,
        variables,
      });
    } else if (params.channel === "EMAIL" && emailProvider === "resend") {
      result = await this.sendEmailWithResend({
        to: params.to,
        template: params.template,
        variables,
      });
    } else if (params.channel === "WHATSAPP" && whatsappProvider === "meta") {
      result = await this.sendWhatsAppWithMeta({
        to: params.to,
        template: params.template,
        variables,
      });
    } else {
      result = this.buildStubResult({
        channel: params.channel,
        to: params.to,
        template: params.template,
        variables,
        reason:
          params.channel === "EMAIL"
            ? "EMAIL_PROVIDER is not set to smtp or resend"
            : params.channel === "WHATSAPP"
              ? "WHATSAPP_PROVIDER is not set to meta"
              : "No real SMS provider configured",
      });
    }

    this.logger.log(
      `[NOTIFICATION:${params.channel}] provider=${result.providerMode} to=${params.to} template=${params.template} payload=${JSON.stringify(variables)}`,
    );

    return result;
  }

  async sendReservationCreated(params: {
    guestPhone?: string | null;
    guestName: string;
    confirmationCode: string;
    startAt: string;
  }) {
    if (!params.guestPhone) {
      return {
        ok: false,
        skipped: true,
        reason: "Guest phone missing",
      };
    }

    return this.send({
      channel: "SMS",
      to: params.guestPhone,
      template: "reservation_created",
      variables: {
        guestName: params.guestName,
        confirmationCode: params.confirmationCode,
        startAt: params.startAt,
      },
    });
  }

  async sendWaitlistPromoted(params: {
    guestPhone?: string | null;
    guestName: string;
    startAt: string;
    tableName?: string | null;
  }) {
    if (!params.guestPhone) {
      return {
        ok: false,
        skipped: true,
        reason: "Guest phone missing",
      };
    }

    return this.send({
      channel: "WHATSAPP",
      to: params.guestPhone,
      template: "waitlist_promoted",
      variables: {
        guestName: params.guestName,
        startAt: params.startAt,
        tableName: params.tableName ?? null,
      },
    });
  }

  async sendReservationCancelled(params: {
    guestPhone?: string | null;
    guestName: string;
    confirmationCode: string;
  }) {
    if (!params.guestPhone) {
      return {
        ok: false,
        skipped: true,
        reason: "Guest phone missing",
      };
    }

    return this.send({
      channel: "SMS",
      to: params.guestPhone,
      template: "reservation_cancelled",
      variables: {
        guestName: params.guestName,
        confirmationCode: params.confirmationCode,
      },
    });
  }

  async sendReviewEmail(params: {
    to: string;
    guestName: string;
    restaurantName: string;
    reviewLink: string;
    privateFeedbackLink?: string | null;
  }) {
    return this.send({
      channel: "EMAIL",
      to: params.to,
      template: "review_request",
      variables: {
        guestName: params.guestName,
        restaurantName: params.restaurantName,
        reviewLink: params.reviewLink,
        privateFeedbackLink: params.privateFeedbackLink ?? null,
        subject: `How was your visit to ${params.restaurantName}?`,
        body: `Hi ${params.guestName},

Thank you for visiting ${params.restaurantName}.

If everything went well, we would really appreciate your Google review:
${params.reviewLink}

If something was not right, please reply to this message so the restaurant can fix it.

Best regards,
${params.restaurantName}`,
      },
    });
  }

  async sendReviewWhatsApp(params: {
    to: string;
    guestName: string;
    restaurantName: string;
    reviewLink: string;
    privateFeedbackLink?: string | null;
  }) {
    return this.send({
      channel: "WHATSAPP",
      to: params.to,
      template: "review_request_whatsapp",
      variables: {
        guestName: params.guestName,
        restaurantName: params.restaurantName,
        reviewLink: params.reviewLink,
        privateFeedbackLink: params.privateFeedbackLink ?? null,
        message:
          `Hi ${params.guestName}, thank you for visiting ${params.restaurantName}. ` +
          `If everything went well, please leave us a Google review: ${params.reviewLink}. ` +
          `If something was not right, reply here so we can fix it.`,
      },
    });
  }
}