export default function CardSavedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-5xl">💳</div>
      <h1 className="text-2xl font-bold">Card saved</h1>
      <p className="max-w-md text-muted-foreground">
        Your card has been saved securely — <strong>no charge has been made
        yet</strong>. The gym will activate your membership and start billing
        when you resume training. Questions? Just ask us at the front desk.
      </p>
    </main>
  );
}
