export default function BillingDonePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-5xl">✅</div>
      <h1 className="text-2xl font-bold">You&apos;re all set</h1>
      <p className="max-w-md text-muted-foreground">
        Your card is saved and your membership is active. You&apos;ll be charged
        automatically each month — no need to pay manually again. Thank you!
      </p>
    </main>
  );
}
