import type { SVGProps } from "react";

import { AGER_SYMBOL_PATH, AGER_SYMBOL_VIEWBOX } from "./symbol-path";

/**
 * The AGER symbol mark (the stylized agricultural-tool glyph). Brand source:
 * docs/brand "Logotype_2.4". Fill is `currentColor` so it themes via text color
 * (ager-blue on light surfaces, editorial-white on blue surfaces). Never recolor
 * outside the official palette, rotate, deform, or add effects.
 */
export function AgerSymbol(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={`0 0 ${AGER_SYMBOL_VIEWBOX} ${AGER_SYMBOL_VIEWBOX}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={AGER_SYMBOL_PATH}
        fill="currentColor"
      />
    </svg>
  );
}
