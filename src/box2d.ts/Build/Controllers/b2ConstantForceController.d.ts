import { b2Controller } from "./b2Controller";
import { b2Vec2 } from "../Common/b2Math";
import { b2TimeStep } from "../Dynamics/b2TimeStep";
import { b2Draw } from "../Common/b2Draw";
/**
 * Applies a force every frame
 */
export declare class b2ConstantForceController extends b2Controller {
    /**
     * The force to apply
     */
    readonly F: b2Vec2;
    Step(step: b2TimeStep): void;
    Draw(draw: b2Draw): void;
}
