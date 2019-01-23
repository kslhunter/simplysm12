import * as nodemailer from "nodemailer";
import {SdWebSocketServiceBase} from "../SdWebSocketServiceBase";
import {Logger} from "@simplysm/common";
import {ISmtpClientSendOption} from "@simplysm/smtp-client-common";

export class SmtpClientService extends SdWebSocketServiceBase {
  private readonly _logger = new Logger("@simplysm/smtp-client-service");

  public async sendAsync(options: ISmtpClientSendOption): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      nodemailer
        .createTransport({
          host: options.host,
          port: options.port,
          secure: options.secure,
          auth: {
            user: options.user,
            pass: options.pass
          }
        })
        .sendMail(
          {
            from: options.from,
            to: options.to,
            cc: options.cc,
            bcc: options.bcc,
            subject: options.subject,
            html: options.html,
            attachments: options.attachments
          },
          (err, info) => {
            if (err) {
              reject(err);
              return;
            }

            this._logger.log(`메일전송 [${info.messageId}]`);
            resolve(info.messageId);
          }
        );
    });
  }
}
