
import { DamagePair } from "../../Common/AttackInfo";

declare class _DamageSkin {
	NoRed: string;
	NoCri: string;
}

declare class _DamageSkinDefault extends _DamageSkin {
	NoBlue: string;
	NoViolet: string;
	NoProduction: string;
	NoKite: string;
}

interface loaded_skin {
	[skin: string]: _DamageSkin;
	default: _DamageSkinDefault;
};

declare class DamageNumberLayer {
	addDamagePair<T extends keyof loaded_skin, K extends keyof loaded_skin[T]>(skin: T, style: K, damagePair: DamagePair, x: number, y: number, delay: number): void;
}

let damageNumberLayer: DamageNumberLayer;
