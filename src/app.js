/**
 * app
 */

"use strict";


/* Node modules */


/* Third-party modules */
const _ = require("lodash");
const Bluebird = require("bluebird");
const mailgunJs = require("mailgun-js");
const MongoClient = require("mongodb").MongoClient;


/* Files */


const config = {
    collection: process.env.MONGODB_COLLECTION,
    countFlag: process.env.COUNT_FLAG,
    domain: process.env.MAILGUN_DOMAIN,
    key: process.env.MAILGUN_KEY,
    retry: Number(process.env.RETRY),
    sentFlag: process.env.SENT_FLAG,
    timeout: Number(process.env.TIMEOUT),
    url: process.env.MONGODB_URL
};

console.log("--- CONFIG ---");
console.log(config);
console.log("--------------");


const mailgun = mailgunJs({
    apiKey: config.key,
    domain: config.domain
});


class Processor {


    static getEmails (db) {

        return db
            .collection(config.collection)
            .find({
                [config.sentFlag]: false,
                [config.countFlag]: {
                    "$lt": config.retry
                }
            })
            .sort({
                created: 1
            })
            .toArray();

    }


    static init () {

        return MongoClient.connect(config.url, {
            promiseLibrary: Bluebird
        }).then(db => {

            return Processor.getEmails(db)
                .then(emails => {

                    if (emails.length === 0) {
                        return;
                    }

                    const batch = db
                        .collection(config.collection)
                        .initializeUnorderedBulkOp();

                    return Bluebird.all(emails.map(email => Processor.sendEmail(batch, email)))
                        .then(result => batch.execute());

                })
                .then(res => {

                    let count = 0;
                    if (_.has(res, "nModified")) {
                        count = res.nModified;
                    }

                    console.log(`${new Date()}: ${count} email(s) sent`);

                })
                .then(() => db.close())
                .catch(err => {
                    db.close();
                    throw err;
                });

        }).catch(err => {
            throw err;
        });

    };


    static sendEmail (batch, email) {

        const obj = {
            subject: email.subject,
            html: email.html,
            text: email.text
        };

        /* Stringify the emails */
        obj.from = Processor.stringifyEmail(email.from);
        [
            "to",
            "cc",
            "bcc"
        ].forEach(type => {

            obj[type] = email[type]
                .map(recipient => Processor.stringifyEmail(recipient))
                .join(", ");

            if (_.isEmpty(obj[type])) {
                delete obj[type];
            }

        });

        return new Bluebird((resolve, reject) => {

            mailgun
                .messages()
                .send(obj, (err, res) => {

                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(res);

                });

        })
            .then(({ id }) => Processor.updateEmail(batch, email, id))
            .catch(err => {
                Processor.updateEmail(batch, email);
                throw err;
            });

    }


    /**
     * Stringify Email
     *
     * Puts the email and name in the format for
     * associating a name and a email address
     *
     * @param {string} emailAddress
     * @param {string} name
     * @returns {string}
     * @private
     */
    static stringifyEmail ({ emailAddress, name = null }) {

        if (name) {
            return `${name} <${emailAddress}>`;
        }
        return emailAddress;

    }


    static updateEmail (batch, email, mailgunId = void 0) {

        batch
            .find({
                _id: email._id
            })
            .update({
                "$set": {
                    mailgunId,
                    sent: mailgunId !== void 0,
                    /* Increment the count */
                    [config.countFlag]: ++email[config.countFlag],
                    /* Update time to now */
                    update: new Date()
                }
            });

    }

}



Processor.init();
setInterval(() => {
    Processor.init();
}, config.timeout);