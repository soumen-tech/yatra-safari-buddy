/* Static import map for city poster images.
   Vite needs static import paths — can't do dynamic `import(...)` for assets. */

import kolkata from "@/assets/poster-kolkata.jpg";
import delhi from "@/assets/poster-delhi.jpg";
import mumbai from "@/assets/poster-mumbai.jpg";
import jaipur from "@/assets/poster-jaipur.jpg";
import varanasi from "@/assets/poster-varanasi.jpg";
import goa from "@/assets/poster-goa.jpg";
import rishikesh from "@/assets/poster-rishikesh.png";
import udaipur from "@/assets/poster-udaipur.png";
import amritsar from "@/assets/poster-amritsar.png";
import darjeeling from "@/assets/poster-darjeeling.png";
import munnar from "@/assets/poster-munnar.png";
import hampi from "@/assets/poster-hampi.png";
import pushkar from "@/assets/poster-pushkar.png";
import manali from "@/assets/poster-manali.png";

export const cityImages: Record<string, string> = {
  kolkata,
  delhi,
  mumbai,
  jaipur,
  varanasi,
  goa,
  rishikesh,
  udaipur,
  amritsar,
  darjeeling,
  munnar,
  hampi,
  pushkar,
  manali,
};
