import { ChamberContent } from "../src/components/ChamberContent";
import { chamberSections } from "../src/data/chamber-sections";
export default function Page() { return <ChamberContent title="Finance & Investment" items={[...chamberSections.finance]} />; }
