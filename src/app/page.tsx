import Accordion from "@/components/Accordion";
import CaseStudies from "@/components/CaseStudies";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Team from "@/components/Team";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <main className="max-w-[1440px] m-auto px-4 xl:px-24 pt-10">
      <Hero />
      <Services />
      <CaseStudies />
      <Accordion />
      <Team />
      <Testimonials />
      <Footer />
    </main>
  );
}
