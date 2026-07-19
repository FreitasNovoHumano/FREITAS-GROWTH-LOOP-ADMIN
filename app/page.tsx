import { redirect } from "next/navigation";
import { productionAppUrl } from "@/lib/app-url";

export default function Home() { redirect(productionAppUrl("/dashboard")); }
