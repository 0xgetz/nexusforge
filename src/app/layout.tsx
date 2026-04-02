import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusForge — AI-Powered Code. Security. Self-Healing.",
  description:
    "The world's first open-source AI development platform combining AI Coding Assistant, Security Scanner, and Self-Healing Engine in one free ecosystem.",
  keywords: [
    "AI coding",
    "security scanner",
    "self-healing code",
    "open source",
    "developer tools",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          data-design-ignore="true"
          dangerouslySetInnerHTML={{
            __html: `(function(){if(window===window.parent||window.__DESIGN_NAV_REPORTER__)return;window.__DESIGN_NAV_REPORTER__=true;function report(){try{window.parent.postMessage({type:'IFRAME_URL_CHANGE',payload:{url:location.origin+location.pathname+location.hash}},'*');}catch(e){}}report();var ps=history.pushState,rs=history.replaceState;history.pushState=function(){ps.apply(this,arguments);report();};history.replaceState=function(){rs.apply(this,arguments);report();};window.addEventListener('popstate',report);window.addEventListener('hashchange',report);window.addEventListener('load',report);})();`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}