export const metadata = {
  title: "Membership Terms & Conditions — U2CAN Boxing",
};

export default function BillingTermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">Membership Terms &amp; Conditions</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Please read these terms carefully. By subscribing to a U2CAN Boxing
        membership you agree to the following.
      </p>

      <ol className="space-y-6">
        <li>
          <h2 className="mb-1 font-semibold">1. Early cancellation penalty</h2>
          <p className="text-sm leading-relaxed">
            Memberships are sold with a committed minimum period. If you cancel
            your membership <strong>before the end of your committed period</strong>,
            you agree to pay a penalty equal to <strong>two (2) months</strong> of
            your membership fee.
          </p>
        </li>
        <li>
          <h2 className="mb-1 font-semibold">2. Pausing your membership</h2>
          <p className="text-sm leading-relaxed">
            A membership may be paused (frozen) for a maximum of{" "}
            <strong>one (1) month</strong> in total. Beyond this limit, billing
            resumes and normal membership terms apply.
          </p>
        </li>
        <li>
          <h2 className="mb-1 font-semibold">3. Recurring billing</h2>
          <p className="text-sm leading-relaxed">
            Your first payment covers the current month in full. Thereafter your
            card is charged automatically on the 1st of every month until you
            cancel in accordance with these terms.
          </p>
        </li>
      </ol>

      <p className="mt-10 text-xs text-muted-foreground">
        U2CAN Boxing · These terms form part of your membership agreement.
      </p>
    </main>
  );
}
