import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const App = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Stakedriven</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Web3 Fundable Polls - Vote and fund features with on-chain funds
        </p>
        <Button className="w-full">Get Started</Button>
      </Card>
    </div>
  );
};

export default App;