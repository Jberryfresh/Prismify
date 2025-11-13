import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  FileSearch,
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: FileSearch,
      title: '7-Component SEO Analysis',
      description: 'Comprehensive audits covering meta tags, content, technical SEO, mobile, performance, security, and accessibility.',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Insights',
      description: 'Get intelligent recommendations powered by advanced AI to optimize your content and improve rankings.',
    },
    {
      icon: TrendingUp,
      title: 'Track Progress Over Time',
      description: 'Monitor your SEO improvements with historical tracking and visual trend charts.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Audits',
      description: 'Get complete SEO reports in seconds, not hours. Our platform analyzes websites at blazing speed.',
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Enterprise-grade security with encrypted data storage. Your site data is safe with us.',
    },
    {
      icon: BarChart3,
      title: 'Actionable Reports',
      description: 'Beautiful PDF reports with prioritized recommendations you can implement immediately.',
    },
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$49',
      description: 'Perfect for freelancers and small projects',
      features: ['10 audits per month', 'Basic SEO analysis', 'Email support', 'PDF reports'],
    },
    {
      name: 'Professional',
      price: '$149',
      description: 'For growing businesses and agencies',
      popular: true,
      features: ['50 audits per month', 'Advanced AI insights', 'Priority support', 'White-label reports', 'API access'],
    },
    {
      name: 'Agency',
      price: '$499',
      description: 'For large agencies and enterprises',
      features: ['Unlimited audits', 'Custom AI models', 'Dedicated support', 'Custom branding', 'Team collaboration', 'Advanced analytics'],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <nav className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Prismify</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login"><Button variant="ghost">Sign In</Button></Link>
              <Link href="/register"><Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">Get Started</Button></Link>
            </div>
          </div>
        </div>
      </nav>
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6" variant="secondary"><Sparkles className="h-3 w-3 mr-1" />Powered by AI</Badge>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Boost Your Rankings with<br /><span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI-Powered SEO Audits</span></h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">Get comprehensive SEO analysis in seconds. Our AI analyzes 7 critical areas and provides actionable insights to improve your search rankings.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"><Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg text-base px-8">Start Free Trial<ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
            <Link href="#features"><Button size="lg" variant="outline" className="text-base px-8">Learn More</Button></Link>
          </div>
        </div>
      </section>
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to rank higher</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Powerful features designed to help you optimize faster</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Choose the plan that&apos;s right for you</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <Card key={tier.name} className={tier.popular ? 'border-indigo-500 dark:border-indigo-500 shadow-xl relative' : ''}>
                {tier.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">Most Popular</Badge>}
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4"><span className="text-4xl font-bold">{tier.price}</span><span className="text-slate-500">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /><span className="text-sm">{feature}</span></li>
                    ))}
                  </ul>
                  <Link href="/register"><Button className={`w-full mt-6 ${tier.popular ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white' : ''}`} variant={tier.popular ? 'default' : 'outline'}>Get Started</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to boost your rankings?</h2>
          <p className="text-xl text-indigo-100 mb-8">Join thousands of businesses optimizing their SEO with Prismify</p>
          <Link href="/register"><Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-50 shadow-lg text-base px-8">Start Your Free Trial<ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
        </div>
      </section>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Sparkles className="h-4 w-4 text-white" /></div>
              <span className="font-semibold">Prismify</span>
            </div>
            <p className="text-sm text-slate-500">&copy; 2025 Prismify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
