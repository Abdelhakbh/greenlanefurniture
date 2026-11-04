import { shareImage } from "@/lib/brand-images";

export async function GET() {
  return shareImage();
}
