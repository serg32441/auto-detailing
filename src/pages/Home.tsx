import Hero from "@/sections/Hero";
import FeaturedServices from "@/sections/FeaturedServices";
import HowItWorks from "@/sections/HowItWorks";
import Technology from "@/sections/Technology";
import Guarantees from "@/sections/Guarantees";
import Pricing from "@/sections/Pricing";
import Booking from "@/sections/Booking";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedServices />
      <HowItWorks />
      <Technology />
      <Guarantees />
      <Pricing />
      <Booking />
      <Footer />
    </main>
  );
}
