import { Container } from "@/components/landing/Container";
import { Hero } from "@/components/landing/Hero";
import { Downloads } from "@/components/landing/Downloads";

export default function Home() {
  return (
    <Container>
      <Hero />
      <Downloads />
    </Container>
  );
}
