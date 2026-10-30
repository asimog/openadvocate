import type { Citation, Judgment, Paragraph } from '@vakilbench/core';
import type { Treatment } from '@vakilbench/citations';

// Every judgment here is invented. Names, numbers and holdings do not describe real decisions.

type Voice = Paragraph['voice'];
type Spec = [Voice, string];

const insc = (year: number, number: number): Citation => ({ scheme: 'INSC', year, number });
const scc = (year: number, volume: number, page: number): Citation => ({ scheme: 'SCC', year, volume, page });

const ORDER_ALLOWED = 'The appeal is allowed. The appellant shall be released on bail on such terms as the trial court may impose.';
const ORDER_DISMISSED = 'The petition is dismissed. The trial court shall proceed expeditiously and conclude the trial within the time indicated.';

function judgment(
  id: string,
  name: string,
  citations: [Citation, ...Citation[]],
  decided: string,
  benchStrength: number,
  judges: string[],
  specs: Spec[],
): Judgment {
  return {
    id,
    citations,
    title: `${name} [synthetic]`,
    decided,
    benchStrength,
    judges: judges.map((j) => `${j} (synthetic)`),
    paragraphs: specs.map(([voice, text], i) => ({ n: i + 1, voice, text })),
  };
}

// Quotes that the golden matter's draft cites. Each but the last is a substring of one paragraph below. The last is cited from a judgment that no tier has.
export const QUOTES = {
  prolongedCustody:
    'prolonged incarceration of an undertrial, without any prospect of the trial concluding within a reasonable time, offends Article 21 and is a weighty ground for the grant of bail',
  tripleTest:
    'the court must be satisfied on all three counts, namely the risk of flight, the risk of tampering with evidence and the risk of influencing witnesses',
  gravityAlone: 'the gravity of the offence alone cannot be a ground to deny bail',
  parity: 'parity with a co-accused already enlarged on bail is by itself a sufficient ground for the grant of bail',
  twoYears: 'continued detention beyond two years, in a case where the investigation is complete, requires specific reasons recorded in writing',
  oneYear: 'an accused who has remained in custody for more than a year without the trial having commenced is ordinarily entitled to be released on bail',
  ruleNotException: 'bail is the rule and jail the exception',
} as const;

export const harinder = judgment('j-001', 'Harinder Singh v. State of Punjab', [insc(2021, 114), scc(2021, 5, 301)], '2021-03-12', 2, ['Justice R. Menon', 'Justice P. Iyer'], [
  ['facts', 'The appellant was arrested in January 2018 in connection with an FIR registered for attempt to murder and has remained in custody since.'],
  ['facts', 'Charges were framed in 2019, but only two of thirty-one prosecution witnesses have been examined. The High Court declined bail by its order of February 2020.'],
  ['submission', 'Learned counsel for the appellant submitted that the appellant has spent more than three years in custody and that the trial is unlikely to conclude in the near future.'],
  ['submission', 'The State submitted that the offence is serious and that the appellant, if released, may influence the injured witnesses.'],
  ['analysis', 'The right to a speedy trial flows from Article 21 and is not extinguished by the gravity of the accusation. Gravity is relevant, but it is one factor among several.'],
  ['analysis', 'Bail is not meant to be punitive. Where the accused has already undergone a substantial period of custody, further detention serves no purpose other than punishment before conviction.'],
  ['analysis', 'The State\'s apprehension about witnesses can be met by conditions of bail. It cannot justify detention without end.'],
  ['analysis', 'The delay is not attributable to the appellant, who has not sought adjournments.'],
  ['holding', `We hold that ${QUOTES.prolongedCustody}.`],
  ['order', ORDER_ALLOWED],
]);

export const meera = judgment('j-002', 'Meera Devi v. Union of India', [insc(2022, 640), scc(2022, 9, 210)], '2022-07-19', 3, ['Justice S. Kapoor', 'Justice L. Fernandes', 'Justice T. Rao'], [
  ['facts', 'The petitioner was arrested in connection with an alleged cheating of depositors and has been in custody for fourteen months.'],
  ['facts', 'The Special Court and the High Court refused bail principally on the gravity of the allegations.'],
  ['submission', 'The petitioner submitted that the investigation is complete, all documents are in the custody of the agency, and she has no reason to flee.'],
  ['submission', 'The Union submitted that the offence affects public savings and that the petitioner is a person of influence.'],
  ['analysis', 'Refusal of bail must rest on reasons connected with the purposes that bail serves. The accused\'s standing in society is not such a reason. Lakshmi Narayan v. State of Rajasthan turned on the accused\'s earlier evasion of arrest and is distinguished.'],
  ['analysis', 'An allegation that the accused is a person of influence is not itself a ground of refusal. It becomes relevant only if there is material that the influence has been or will be used.'],
  ['analysis', 'Where the documents are in the custody of the investigating agency, the risk of tampering is correspondingly reduced.'],
  ['analysis', 'Flight risk is assessed from the accused\'s roots in the community, conduct on earlier bail and the nature of the penalty.'],
  ['analysis', 'Influence over witnesses must be shown by material and cannot be assumed from the status of the accused.'],
  ['analysis', 'The three considerations operate together, as explained below.'],
  ['holding', `We hold that, before bail is refused on the ground of apprehended misconduct, ${QUOTES.tripleTest}.`],
  ['holding', 'This test is not displaced by the gravity of the offence, which goes to the degree of risk and not to its existence.'],
  ['order', ORDER_ALLOWED],
]);

export const sanjay = judgment('j-003', 'Sanjay Verma v. State of Uttar Pradesh', [insc(2018, 905), scc(2018, 12, 77)], '2018-11-02', 2, ['Justice A. Banerjee', 'Justice K. Joseph'], [
  ['facts', 'The appellant is accused of causing grievous hurt with a weapon in a village dispute. A co-accused was granted bail by the High Court in May 2018.'],
  ['facts', 'The appellant\'s own application was rejected in July 2018 without reference to the order in favour of the co-accused.'],
  ['submission', 'The appellant submitted that the role attributed to him is identical to that of the co-accused and that denying him bail is arbitrary.'],
  ['submission', 'The State submitted that the appellant is alleged to have struck the first blow and that parity cannot be claimed.'],
  ['analysis', 'Parity is a rule of fairness. Like cases must be treated alike unless there is a reason to distinguish them.'],
  ['analysis', 'Courts must compare the roles attributed to the accused on the charge-sheet and not the labels used in the arguments.'],
  ['analysis', 'On the charge-sheet the roles of the two accused are identical.'],
  ['holding', `We hold that ${QUOTES.parity}, where the roles attributed are identical.`],
  ['order', ORDER_ALLOWED],
]);

export const arvind = judgment('j-004', 'Arvind Nair v. State of Karnataka', [insc(2023, 412), scc(2023, 4, 1)], '2023-05-09', 5, ['Justice D. Chandra', 'Justice M. Pillai', 'Justice N. Gupta', 'Justice V. Reddy', 'Justice H. Sen'], [
  ['facts', 'A bench of three judges referred the question whether parity with a co-accused is by itself a ground for bail, doubting the correctness of Sanjay Verma v. State of Uttar Pradesh.'],
  ['facts', 'The reference arises from an appeal against refusal of bail to an accused whose co-accused had been released.'],
  ['submission', 'Counsel for the appellant relied on Sanjay Verma and submitted that parity must be treated as conclusive.'],
  ['submission', 'The State submitted that conclusive parity would let the weakest order in a case bind every other court.'],
  ['analysis', 'Parity is a consideration of consistency. It does not substitute for an examination of the individual accused.'],
  ['analysis', 'An earlier order granting bail may rest on facts that the later court cannot see or on an error that should not be repeated.'],
  ['analysis', 'The role of the accused, criminal antecedents and the stage of the trial must be weighed together with any claim of parity.'],
  ['analysis', 'The proposition in Sanjay Verma is stated too widely and cannot stand with the structure of the bail provisions.'],
  ['analysis', 'We have considered whether the result in Sanjay Verma can be saved on its facts and find that it can.'],
  ['holding', 'We hold that parity is one of the relevant considerations and is never by itself a sufficient ground for bail.'],
  ['holding', 'To the extent that Sanjay Verma v. State of Uttar Pradesh holds that parity alone suffices, it is overruled.'],
  ['holding', 'A claim of parity must be examined together with the role of the accused, antecedents and the stage of the trial.'],
  ['order', ORDER_DISMISSED],
]);

export const kavita = judgment('j-005', 'Kavita Rao v. State of Maharashtra', [insc(2019, 233), scc(2019, 3, 456)], '2019-02-20', 3, ['Justice B. Nambiar', 'Justice C. Desai', 'Justice F. Qureshi'], [
  ['facts', 'The appellant has been in custody for nineteen months in a case of cheating and forgery. The trial has not commenced.'],
  ['facts', 'The Sessions Court and the High Court rejected bail, observing that the documents were voluminous.'],
  ['submission', 'The appellant submitted that the prosecution has not yet supplied copies of documents and that charges are not framed.'],
  ['submission', 'The State submitted that the volume of documents is the reason for delay and not any fault of the prosecution.'],
  ['analysis', 'The volume of documents is a reason for the prosecution to hasten its steps and not a reason to prolong the accused\'s custody.'],
  ['analysis', 'Article 21 requires that the period an accused spends in custody before trial be proportionate to the stage of the proceedings.'],
  ['analysis', 'A court that refuses bail must record why release would defeat the purposes of the trial.'],
  ['analysis', 'The appellant has no previous criminal record and has cooperated with the investigation.'],
  ['analysis', 'The documents are in the possession of the court and cannot be tampered with.'],
  ['analysis', 'The offence is punishable with a maximum of seven years, and nineteen months is a considerable portion.'],
  ['analysis', 'We see no reason why the appellant should remain in custody while the prosecution completes its steps.'],
  ['holding', `We hold that ${QUOTES.oneYear}, unless the delay is attributable to the accused.`],
  ['holding', 'The court may impose conditions to secure attendance and to protect the evidence.'],
  ['order', ORDER_ALLOWED],
]);

export const imran = judgment('j-006', 'Imran Sheikh v. State of Bihar', [insc(2020, 577), scc(2020, 8, 142)], '2020-08-11', 2, ['Justice G. Mishra', 'Justice W. D\'Souza'], [
  ['facts', 'The applicant, accused of cheating, claims bail on the ground that he has been in custody for thirteen months without commencement of trial.'],
  ['facts', 'The High Court refused bail after noting that the applicant had earlier failed to appear.'],
  ['submission', 'The applicant relied on Kavita Rao v. State of Maharashtra and submitted that he is entitled to bail as of right.'],
  ['submission', 'The State submitted that the applicant absconded earlier and that custody for thirteen months is not excessive.'],
  ['analysis', 'The period of custody is a relevant factor, but its relevance varies with the offence, the conduct of the accused and the stage of the case.'],
  ['analysis', 'A fixed period after which bail follows automatically substitutes arithmetic for judgment.'],
  ['analysis', 'The applicant\'s earlier failure to appear weighs against him in this case.'],
  ['holding', 'The observations in Kavita Rao v. State of Maharashtra cannot be read as a rule of entitlement and, to that extent, are overruled.'],
  ['holding', 'Bail remains a matter of judicial discretion to be exercised on the facts of each case.'],
  ['order', ORDER_DISMISSED],
]);

export const dinesh = judgment('j-007', 'Dinesh Patel v. State of Gujarat', [insc(2026, 311), scc(2026, 6, 55)], '2026-06-24', 3, ['Justice R. Menon', 'Justice S. Kapoor', 'Justice U. Bhatt'], [
  ['facts', 'The appellant has been in custody for twenty-seven months in a case of attempt to murder. The investigation is complete and the charge-sheet was filed within the prescribed time.'],
  ['facts', 'The High Court refused bail on the ground that the injury was grievous and the victim\'s statement had not yet been recorded in court.'],
  ['submission', 'The appellant submitted that the victim has been examined by the police, that the injury has healed and that nothing remains to be recovered.'],
  ['submission', 'The State submitted that the appellant is a repeat offender and that the victim fears reprisal.'],
  ['analysis', 'A claim of reprisal must be supported by material. The record contains no complaint of threat in twenty-seven months of custody.'],
  ['analysis', 'The seriousness of the injury was known when the charge-sheet was filed and does not change with the passage of time.'],
  ['analysis', 'Antecedents are relevant, but both cases cited against the appellant ended in acquittal.'],
  ['analysis', 'We have considered the pace of the trial, which is listed for evidence only once in four months.'],
  ['holding', `We hold that ${QUOTES.twoYears}.`],
  ['holding', 'The High Court did not record such reasons and the order refusing bail cannot be sustained.'],
  ['order', ORDER_ALLOWED],
]);

export const lakshmi = judgment('j-008', 'Lakshmi Narayan v. State of Rajasthan', [insc(2017, 700), scc(2017, 10, 44)], '2017-09-05', 2, ['Justice I. Thakur', 'Justice J. Naidu'], [
  ['facts', 'The petitioner is accused of rioting and causing hurt. He was arrested in a neighbouring State after being absent for eight months.'],
  ['facts', 'The Sessions Court rejected bail and the High Court affirmed.'],
  ['submission', 'The petitioner submitted that bail is not punishment and that he has now been in custody for five months.'],
  ['submission', 'The State submitted that the petitioner evaded arrest and that his conduct shows he will flee again.'],
  ['analysis', 'Bail is not meant as punishment, but neither is it a matter of right for an accused who has evaded process.'],
  ['analysis', 'Absence from the jurisdiction for eight months after the offence is a material circumstance.'],
  ['holding', 'Where an accused has evaded arrest for a substantial period, the court may decline bail even if the custody so far is short.'],
  ['order', ORDER_DISMISSED],
]);

export const farooq = judgment('j-009', 'Farooq Ahmad v. Union Territory of Jammu and Kashmir', [insc(2024, 88), scc(2024, 2, 391)], '2024-01-30', 2, ['Justice A. Banerjee', 'Justice O. Lal'], [
  ['facts', 'The appellant is accused of an attack with a sharp weapon. The injured has survived and has been discharged from hospital.'],
  ['facts', 'The appellant was arrested within a day of the incident and has been in custody for twenty months.'],
  ['facts', 'The High Court refused bail, relying on the nature of the weapon and the injuries.'],
  ['submission', 'The State submitted that the offence is grave, that the weapon was recovered at the instance of the appellant and that release would send the wrong signal.'],
  ['submission', `Learned counsel for the appellant submitted that ${QUOTES.gravityAlone}, and that twenty months in custody is excessive.`],
  ['analysis', 'The gravity of the offence is a relevant factor in every bail decision. Its weight depends on the other circumstances of the case.'],
  ['analysis', 'Recovery of the weapon is complete, so custody is no longer needed for the investigation.'],
  ['analysis', 'The trial has not framed charges even after twenty months.'],
  ['holding', 'Gravity of the offence must be weighed together with the period of custody and the progress of the trial. It does not by itself decide the matter.'],
  ['order', ORDER_ALLOWED],
]);

export const prakash = judgment('j-010', 'Prakash Chandra v. State (NCT of Delhi)', [insc(2025, 301), scc(2025, 3, 120)], '2025-04-16', 3, ['Justice L. Fernandes', 'Justice Y. Ahuja', 'Justice K. Joseph'], [
  ['facts', 'The petitioner has been in custody for twenty-two months in a case under the Indian Penal Code. The trial court has examined four of thirty witnesses.'],
  ['facts', 'The High Court of Delhi declined bail by an order of November 2024.'],
  ['submission', 'The petitioner relied on Harinder Singh v. State of Punjab and submitted that prolonged custody entitles him to bail.'],
  ['submission', 'The State submitted that the petitioner has a history of absconding in a previous case.'],
  ['analysis', 'We follow Harinder Singh v. State of Punjab, which correctly states that custody of long duration weighs under Article 21.'],
  ['analysis', 'The question in each case is whether the continued detention still serves a purpose that the law recognises.'],
  ['analysis', 'The petitioner\'s absconding in the previous case ended with his appearance within a week and does not show a present risk of flight.'],
  ['holding', 'We hold that custody of more than eighteen months with the trial at its early stage calls for bail on conditions unless a specific risk is shown.'],
  ['order', ORDER_ALLOWED],
]);

export const JUDGMENTS: readonly Judgment[] = [harinder, meera, sanjay, arvind, kavita, imran, dinesh, lakshmi, farooq, prakash];

// Cited later-judgment treatments, keyed by the id of the judgment being treated.
export const TREATMENTS: Readonly<Record<string, Treatment[]>> = {
  'j-003': [{ by: arvind, relation: 'overrules', paragraph: 11 }],
  'j-005': [{ by: imran, relation: 'overrules', paragraph: 8 }],
  'j-008': [{ by: meera, relation: 'distinguishes', paragraph: 5 }],
  'j-001': [{ by: prakash, relation: 'follows', paragraph: 5 }],
};

// Cited by the golden matter's draft but present in no tier.
export const MISSING_CITATION: Citation = scc(2019, 7, 612);
