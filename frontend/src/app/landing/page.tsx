"use client";

import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Zap, Shield, Users, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const features = [
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Análisis en Tiempo Real",
      description: "Obtén información valiosa de tus llamadas al instante con nuestro motor de análisis avanzado.",
      color: "text-blue-500"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Seguridad Garantizada",
      description: "Tus datos están protegidos con cifrado de grado empresarial en todo momento.",
      color: "text-emerald-500"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Equipos Eficientes",
      description: "Mejora el rendimiento de tu equipo con herramientas de análisis de llamadas.",
      color: "text-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">CallAnalysis</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Características</a>
              <a href="#pricing" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Precios</a>
              <a href="#contact" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Contacto</a>
            </nav>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Comenzar gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-background pt-32">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-x-4 text-sm font-semibold leading-6 text-primary">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Potenciado por IA
              </span>
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
            >
              Transforma tus <span className="text-primary">llamadas</span> en conocimiento accionable
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto"
            >
              Analiza, entiende y mejora tus interacciones telefónicas con nuestra plataforma de análisis de llamadas impulsada por IA.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex items-center justify-center gap-4 flex-wrap"
            >
              <Button asChild size="lg">
                <Link href="/register" className="gap-2">
                  Comenzar ahora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="#features" className="gap-2">
                  Ver características
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Potencia tu negocio</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Todo lo que necesitas para analizar tus llamadas
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Descubre cómo nuestra plataforma puede transformar la forma en que gestionas y analizas las llamadas de tu negocio.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.color} bg-opacity-10`}>
                      {feature.icon}
                    </div>
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">{feature.description}</p>
                    <p className="mt-3">
                      <a href="#" className="text-sm font-semibold leading-6 text-primary inline-flex items-center">
                        Saber más <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden bg-primary py-24 sm:py-32">
        <div className="absolute -top-24 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl" aria-hidden="true">
          <div className="aspect-[1400/600] w-[87.5rem] bg-gradient-to-r from-primary/50 to-primary-foreground/30 opacity-20" />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                ¿Listo para transformar tus llamadas?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/90">
                Únete a cientos de empresas que ya están mejorando su comunicación con nuestra plataforma de análisis de llamadas.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  <Link href="/register">
                    Comenzar prueba gratuita
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg"
                  className="text-white border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <Link href="/demo">
                    Ver demostración <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            {[{
              name: 'Twitter',
              href: '#',
              icon: (props: any) => (
                <svg className="h-6 w-6 text-muted-foreground hover:text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              ),
            }, {
              name: 'GitHub',
              href: '#',
              icon: (props: any) => (
                <svg className="h-6 w-6 text-muted-foreground hover:text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              ),
            }, {
              name: 'LinkedIn',
              href: '#',
              icon: (props: any) => (
                <svg className="h-6 w-6 text-muted-foreground hover:text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              ),
            }].map((item) => (
              <a key={item.name} href={item.href} className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </a>
            ))}
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-sm leading-5 text-muted-foreground">
              &copy; {new Date().getFullYear()} CallAnalysis. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}