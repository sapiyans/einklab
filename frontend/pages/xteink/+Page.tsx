import {
  MonitorPlay,
  Cpu,
  ArrowUpRight,
  MessageCircle,
  Mail,
  Sparkles,
} from "lucide-react";
import { links, useLinks } from "@/config/links";
import { FaGithub } from "react-icons/fa";

type ServiceCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  glow: string;
};


const socials = [
  { href: links.github, icon: FaGithub, label: "GitHub" },
  //{ href: links.whatsapp, icon: MessageCircle, label: "WhatsApp" },
  { href: links.email, icon: Mail, label: "Email" },
];

export default function Page() {
  const nav = useLinks();

  const services: ServiceCard[] = [
    {
      title: "Screensaver",
      description: "Explore, crie e publique screensavers para o seu Xteink.",
      href: nav.screensaver,
      icon: MonitorPlay,
      gradient: "from-blue-500 via-indigo-500 to-violet-600",
      glow: "group-hover:shadow-blue-500/40",
    },
    {
      title: "Firmware",
      description: "Baixe e instale a versão mais recente do firmware.",
      href: nav.firmware,
      icon: Cpu,
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      glow: "group-hover:shadow-emerald-500/40",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white">
      {/* Background decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-125 w-125 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-125 w-125 rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            E-InkLab · Xteink
          </div>
          <h1 className="bg-linear-to-b from-white to-white/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Ferramentas E-Ink
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/50">
            Explore e crie screensavers ou pesquise o firmware
do seu leitor XTEINK.
          </p>
        </div>

        {/* Cards */}
        <div className="grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <a
                key={service.title}
                href={service.href}
                className="group relative block animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${100 + i * 100}ms` }}
              >
                <div
                  className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl ${service.glow}`}
                >
                  {/* Glow no canto */}
                  <div
                    className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-linear-to-br ${service.gradient} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`}
                  />

                  {/* Ícone */}
                  <div
                    className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${service.gradient} shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Título + seta */}
                  <div className="relative mb-2 flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {service.title}
                    </h2>
                    <ArrowUpRight className="h-4 w-4 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                  </div>

                  {/* Descrição */}
                  <p className="relative text-sm leading-relaxed text-white/50">
                    {service.description}
                  </p>

                  {/* Linha decorativa */}
                  <div
                    className={`relative mt-5 h-px w-full bg-linear-to-r ${service.gradient} opacity-30 transition-opacity duration-300 group-hover:opacity-70`}
                  />
                </div>
              </a>
            );
          })}
        </div>

        {/* Socials */}
        <div
          className="mt-14 flex items-center gap-2 animate-in fade-in duration-1000"
          style={{ animationDelay: "400ms" }}
        >
          {socials.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-white/30">
          © {new Date().getFullYear()} E-InkLab
        </p>
      </div>
    </div>
  );
}