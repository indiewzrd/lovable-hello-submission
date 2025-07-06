import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart3, Users, DollarSign, Shield, Zap, Globe } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Crowdfund your new product or feature development
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Launch polls where your community vote on what to build next. 
          You get funds of winning options. Build products your users really want.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Launch a Poll <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why to use StakeDriven?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Reliable Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get genuine insights on feature prioritization from users who put real 
                money behind their preferences.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <DollarSign className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Alternative to VC Funding</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Crowdfund your new product development and give back to your community 
                when you are ready.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Increased Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Boost community engagement by allowing partial input on the product roadmap.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20 bg-muted/50">
        <h2 className="text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
              1
            </div>
            <h3 className="font-semibold mb-2">Create a Poll</h3>
            <p className="text-sm text-muted-foreground">
              Set up poll options, duration, and token amount per vote
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
              2
            </div>
            <h3 className="font-semibold mb-2">Community Votes</h3>
            <p className="text-sm text-muted-foreground">
              Users vote by staking funds on preferred option, and earn yield
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
              3
            </div>
            <h3 className="font-semibold mb-2">Winners Decided</h3>
            <p className="text-sm text-muted-foreground">
              Top options are determined when the poll ends
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
              4
            </div>
            <h3 className="font-semibold mb-2">Funds Distributed</h3>
            <p className="text-sm text-muted-foreground">
              Poll creator receives funds from winning options
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Perfect For
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Startups</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Validate product ideas and prioritize features based on real user commitment
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">DAOs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Make governance decisions with economic stakes, and fund your next initiative
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Memecoin/NFT/Influencers</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Let followers fund your next big moves
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join the future of stake-driven development
        </p>
        <Button size="lg" asChild>
          <Link href="/dashboard">
            Create Your First Poll <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </main>
  )
}