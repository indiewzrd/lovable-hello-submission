import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8">
        <h1 className="text-2xl font-bold mb-4">Stakedriven</h1>
        <p className="text-muted-foreground mb-4">
          Web3 Fundable Polls - Vote and fund features with on-chain funds
        </p>
        <Button>Get Started</Button>
      </Card>
    </div>
  );
};

export default Index;