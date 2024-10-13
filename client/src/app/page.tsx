import Navbar from "@/components/base/Navbar";
import HeroSection from "@/components/base/HeroSection";
import FeatureSection from "@/components/base/FeatureSection";
import UserReviews from "@/components/base/UserReviews";
import Footer from "@/components/base/Footer";
import { getServerSession } from "next-auth";
import { authOptions, CustomSession } from "./api/auth/[...nextauth]/options";
// import { authOptions, CustomSession } from "./api/auth/[...nextauth]/options";
// import { getServerSession } from "next-auth";

export default async function LandingPage() {
  const session: CustomSession | null = await getServerSession(authOptions);

  return (
    <div className='min-h-screen flex flex-col '>
      <Navbar user={session?.user} />
      <HeroSection user={session?.user} />

      <FeatureSection />

      <UserReviews />

      <Footer />
    </div>
  );
}
