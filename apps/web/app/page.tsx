import Link from 'next/link';import Link from 'next/link';import Image from "next/image";

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import {import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';export default function Home() {

  Sparkles,

  FileSearch,import { Badge } from '@/components/ui/badge';  return (

  TrendingUp,

  Zap,import {    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">

  Shield,

  BarChart3,  Sparkles,      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">

  CheckCircle2,

  ArrowRight,  FileSearch,        <Image

} from 'lucide-react';

  TrendingUp,          className="dark:invert"

export default function LandingPage() {

  const features = [  Zap,          src="/next.svg"

    {

      icon: FileSearch,  Shield,          alt="Next.js logo"

      title: '7-Component SEO Analysis',

      description:  BarChart3,          width={100}

        'Comprehensive audits covering meta tags, content, technical SEO, mobile, performance, security, and accessibility.',

    },  CheckCircle2,          height={20}

    {

      icon: Sparkles,  ArrowRight,          priority

      title: 'AI-Powered Insights',

      description:} from 'lucide-react';        />

        'Get intelligent recommendations powered by advanced AI to optimize your content and improve rankings.',

    },        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">

    {

      icon: TrendingUp,export default function LandingPage() {          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">

      title: 'Track Progress Over Time',

      description:  const features = [            To get started, edit the page.tsx file.

        'Monitor your SEO improvements with historical tracking and visual trend charts.',

    },    {          </h1>

    {

      icon: Zap,      icon: FileSearch,          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">

      title: 'Lightning Fast Audits',

      description:      title: '7-Component SEO Analysis',            Looking for a starting point or more instructions? Head over to{" "}

        'Get complete SEO reports in seconds, not hours. Our platform analyzes websites at blazing speed.',

    },      description:            <a

    {

      icon: Shield,        'Comprehensive audits covering meta tags, content, technical SEO, mobile, performance, security, and accessibility.',              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

      title: 'Security & Privacy',

      description:    },              className="font-medium text-zinc-950 dark:text-zinc-50"

        'Enterprise-grade security with encrypted data storage. Your site data is safe with us.',

    },    {            >

    {

      icon: BarChart3,      icon: Sparkles,              Templates

      title: 'Actionable Reports',

      description:      title: 'AI-Powered Insights',            </a>{" "}

        'Beautiful PDF reports with prioritized recommendations you can implement immediately.',

    },      description:            or the{" "}

  ];

        'Get intelligent recommendations powered by advanced AI to optimize your content and improve rankings.',            <a

  const pricingTiers = [

    {    },              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

      name: 'Starter',

      price: '$49',    {              className="font-medium text-zinc-950 dark:text-zinc-50"

      description: 'Perfect for freelancers and small projects',

      features: [      icon: TrendingUp,            >

        '10 audits per month',

        'Basic SEO analysis',      title: 'Track Progress Over Time',              Learning

        'Email support',

        'PDF reports',      description:            </a>{" "}

      ],

    },        'Monitor your SEO improvements with historical tracking and visual trend charts.',            center.

    {

      name: 'Professional',    },          </p>

      price: '$149',

      description: 'For growing businesses and agencies',    {        </div>

      popular: true,

      features: [      icon: Zap,        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">

        '50 audits per month',

        'Advanced AI insights',      title: 'Lightning Fast Audits',          <a

        'Priority support',

        'White-label reports',      description:            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"

        'API access',

      ],        'Get complete SEO reports in seconds, not hours. Our platform analyzes websites at blazing speed.',            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

    },

    {    },            target="_blank"

      name: 'Agency',

      price: '$499',    {            rel="noopener noreferrer"

      description: 'For large agencies and enterprises',

      features: [      icon: Shield,          >

        'Unlimited audits',

        'Custom AI models',      title: 'Security & Privacy',            <Image

        'Dedicated support',

        'Custom branding',      description:              className="dark:invert"

        'Team collaboration',

        'Advanced analytics',        'Enterprise-grade security with encrypted data storage. Your site data is safe with us.',              src="/vercel.svg"

      ],

    },    },              alt="Vercel logomark"

  ];

    {              width={16}

  return (

    <div className="min-h-screen bg-white dark:bg-slate-950">      icon: BarChart3,              height={16}

      {/* Navigation */}

      <nav className="border-b border-slate-200 dark:border-slate-800">      title: 'Actionable Reports',            />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between items-center h-16">      description:            Deploy Now

            <div className="flex items-center gap-2">

              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">        'Beautiful PDF reports with prioritized recommendations you can implement immediately.',          </a>

                <Sparkles className="h-5 w-5 text-white" />

              </div>    },          <a

              <span className="text-xl font-bold text-slate-900 dark:text-white">

                Prismify  ];            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"

              </span>

            </div>            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

            <div className="flex items-center gap-4">

              <Link href="/login">  const pricingTiers = [            target="_blank"

                <Button variant="ghost">Sign In</Button>

              </Link>    {            rel="noopener noreferrer"

              <Link href="/register">

                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">      name: 'Starter',          >

                  Get Started

                </Button>      price: '$49',            Documentation

              </Link>

            </div>      description: 'Perfect for freelancers and small projects',          </a>

          </div>

        </div>      features: [        </div>

      </nav>

        '10 audits per month',      </main>

      {/* Hero Section */}

      <section className="py-20 sm:py-32">        'Basic SEO analysis',    </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <Badge className="mb-6" variant="secondary">        'Email support',  );

            <Sparkles className="h-3 w-3 mr-1" />

            Powered by AI        'PDF reports',}

          </Badge>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">      ],

            Boost Your Rankings with    },

            <br />    {

            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">      name: 'Professional',

              AI-Powered SEO Audits      price: '$149',

            </span>      description: 'For growing businesses and agencies',

          </h1>      popular: true,

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">      features: [

            Get comprehensive SEO analysis in seconds. Our AI analyzes 7 critical areas        '50 audits per month',

            and provides actionable insights to improve your search rankings.        'Advanced AI insights',

          </p>        'Priority support',

          <div className="flex flex-col sm:flex-row gap-4 justify-center">        'White-label reports',

            <Link href="/register">        'API access',

              <Button      ],

                size="lg"    },

                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg text-base px-8"    {

              >      name: 'Agency',

                Start Free Trial      price: '$499',

                <ArrowRight className="ml-2 h-5 w-5" />      description: 'For large agencies and enterprises',

              </Button>      features: [

            </Link>        'Unlimited audits',

            <Link href="#features">        'Custom AI models',

              <Button size="lg" variant="outline" className="text-base px-8">        'Dedicated support',

                Learn More        'Custom branding',

              </Button>        'Team collaboration',

            </Link>        'Advanced analytics',

          </div>      ],

        </div>    },

      </section>  ];



      {/* Features Section */}  return (

      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900">    <div className="min-h-screen bg-white dark:bg-slate-950">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">      {/* Navigation */}

          <div className="text-center mb-16">      <nav className="border-b border-slate-200 dark:border-slate-800">

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              Everything you need to rank higher          <div className="flex justify-between items-center h-16">

            </h2>            <div className="flex items-center gap-2">

            <p className="text-lg text-slate-600 dark:text-slate-400">              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">

              Powerful features designed to help you optimize faster                <Sparkles className="h-5 w-5 text-white" />

            </p>              </div>

          </div>              <span className="text-xl font-bold text-slate-900 dark:text-white">

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">                Prismify

            {features.map((feature) => {              </span>

              const Icon = feature.icon;            </div>

              return (            <div className="flex items-center gap-4">

                <Card key={feature.title}>              <Link href="/login">

                  <CardHeader>                <Button variant="ghost">Sign In</Button>

                    <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4">              </Link>

                      <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />              <Link href="/register">

                    </div>                <Button className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">

                    <CardTitle>{feature.title}</CardTitle>                  Get Started

                    <CardDescription>{feature.description}</CardDescription>                </Button>

                  </CardHeader>              </Link>

                </Card>            </div>

              );          </div>

            })}        </div>

          </div>      </nav>

        </div>

      </section>      {/* Hero Section */}

      <section className="py-20 sm:py-32">

      {/* Pricing Section */}        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

      <section id="pricing" className="py-20">          <Badge className="mb-6" variant="secondary">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">            <Sparkles className="h-3 w-3 mr-1" />

          <div className="text-center mb-16">            Powered by AI

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">          </Badge>

              Simple, transparent pricing          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">

            </h2>            Boost Your Rankings with

            <p className="text-lg text-slate-600 dark:text-slate-400">            <br />

              Choose the plan that&apos;s right for you            <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">

            </p>              AI-Powered SEO Audits

          </div>            </span>

          <div className="grid md:grid-cols-3 gap-8">          </h1>

            {pricingTiers.map((tier) => (          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">

              <Card            Get comprehensive SEO analysis in seconds. Our AI analyzes 7 critical areas

                key={tier.name}            and provides actionable insights to improve your search rankings.

                className={          </p>

                  tier.popular          <div className="flex flex-col sm:flex-row gap-4 justify-center">

                    ? 'border-indigo-500 dark:border-indigo-500 shadow-xl relative'            <Link href="/register">

                    : ''              <Button

                }                size="lg"

              >                className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg text-base px-8"

                {tier.popular && (              >

                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">                Start Free Trial

                    Most Popular                <ArrowRight className="ml-2 h-5 w-5" />

                  </Badge>              </Button>

                )}            </Link>

                <CardHeader>            <Link href="#features">

                  <CardTitle>{tier.name}</CardTitle>              <Button size="lg" variant="outline" className="text-base px-8">

                  <CardDescription>{tier.description}</CardDescription>                Learn More

                  <div className="mt-4">              </Button>

                    <span className="text-4xl font-bold">{tier.price}</span>            </Link>

                    <span className="text-slate-500">/month</span>          </div>

                  </div>        </div>

                </CardHeader>      </section>

                <CardContent>

                  <ul className="space-y-3">      {/* Features Section */}

                    {tier.features.map((feature) => (      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900">

                      <li key={feature} className="flex items-center gap-2">        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                        <CheckCircle2 className="h-5 w-5 text-green-600" />          <div className="text-center mb-16">

                        <span className="text-sm">{feature}</span>            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">

                      </li>              Everything you need to rank higher

                    ))}            </h2>

                  </ul>            <p className="text-lg text-slate-600 dark:text-slate-400">

                  <Link href="/register">              Powerful features designed to help you optimize faster

                    <Button            </p>

                      className={`w-full mt-6 ${          </div>

                        tier.popular          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'            {features.map((feature) => {

                          : ''              const Icon = feature.icon;

                      }`}              return (

                      variant={tier.popular ? 'default' : 'outline'}                <Card key={feature.title}>

                    >                  <CardHeader>

                      Get Started                    <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4">

                    </Button>                      <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />

                  </Link>                    </div>

                </CardContent>                    <CardTitle>{feature.title}</CardTitle>

              </Card>                    <CardDescription>{feature.description}</CardDescription>

            ))}                  </CardHeader>

          </div>                </Card>

        </div>              );

      </section>            })}

          </div>

      {/* CTA Section */}        </div>

      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">      </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">      {/* Pricing Section */}

            Ready to boost your rankings?      <section id="pricing" className="py-20">

          </h2>        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <p className="text-xl text-indigo-100 mb-8">          <div className="text-center mb-16">

            Join thousands of businesses optimizing their SEO with Prismify            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">

          </p>              Simple, transparent pricing

          <Link href="/register">            </h2>

            <Button            <p className="text-lg text-slate-600 dark:text-slate-400">

              size="lg"              Choose the plan that&apos;s right for you

              className="bg-white text-indigo-600 hover:bg-slate-50 shadow-lg text-base px-8"            </p>

            >          </div>

              Start Your Free Trial          <div className="grid md:grid-cols-3 gap-8">

              <ArrowRight className="ml-2 h-5 w-5" />            {pricingTiers.map((tier) => (

            </Button>              <Card

          </Link>                key={tier.name}

        </div>                className={

      </section>                  tier.popular

                    ? 'border-indigo-500 dark:border-indigo-500 shadow-xl relative'

      {/* Footer */}                    : ''

      <footer className="border-t border-slate-200 dark:border-slate-800 py-12">                }

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">              >

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">                {tier.popular && (

            <div className="flex items-center gap-2">                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-indigo-600 to-purple-600 text-white">

              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">                    Most Popular

                <Sparkles className="h-4 w-4 text-white" />                  </Badge>

              </div>                )}

              <span className="font-semibold">Prismify</span>                <CardHeader>

            </div>                  <CardTitle>{tier.name}</CardTitle>

            <p className="text-sm text-slate-500">                  <CardDescription>{tier.description}</CardDescription>

              &copy; 2025 Prismify. All rights reserved.                  <div className="mt-4">

            </p>                    <span className="text-4xl font-bold">{tier.price}</span>

          </div>                    <span className="text-slate-500">/month</span>

        </div>                  </div>

      </footer>                </CardHeader>

    </div>                <CardContent>

  );                  <ul className="space-y-3">

}                    {tier.features.map((feature) => (

                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button
                      className={`w-full mt-6 ${
                        tier.popular
                          ? 'bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                          : ''
                      }`}
                      variant={tier.popular ? 'default' : 'outline'}
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to boost your rankings?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of businesses optimizing their SEO with Prismify
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-slate-50 shadow-lg text-base px-8"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Prismify</span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; 2025 Prismify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
