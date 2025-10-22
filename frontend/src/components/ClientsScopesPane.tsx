import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function ClientsScopesPane() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="max-w-xl text-center">
        <CardHeader>
          <CardTitle>Clients &amp; Scopes</CardTitle>
          <CardDescription>Backend integration pending.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          This panel will surface client scope controls once the gateway exposes the necessary endpoints.
        </CardContent>
      </Card>
    </div>
  );
}
