import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import People from "@/components/sections/People";
import Program from "@/components/sections/Program";
import Past from "@/components/sections/Past";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <About />
        <People />
        <Program />
        <Past />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
