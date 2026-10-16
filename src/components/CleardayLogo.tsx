import lightLogo from "@/assets/clearday-logo-light.png";
import darkLogo from "@/assets/clearday-logo-dark.png";

export function CleardayLogo() {
  return <span className="inline-flex shrink-0 items-center gap-2" aria-label="clearday">
    <img src={lightLogo} width={160} height={160} alt="" className="size-9 dark:hidden" />
    <img src={darkLogo} width={160} height={160} alt="" className="hidden size-9 dark:block" />
    <span className="font-heading text-[23px] font-semibold leading-none">clearday</span>
  </span>;
}