import { b2Controller } from "./b2Controller";
import { b2Mat22 } from "../Common/b2Math";
import { b2TimeStep } from "../Dynamics/b2TimeStep";
import { b2Draw } from "../Common/b2Draw";
/**
 * Applies top down linear damping to the controlled bodies
 * The damping is calculated by multiplying velocity by a matrix
 * in local co-ordinates.
 */
export declare class b2TensorDampingController extends b2Controller {
    readonly T: b2Mat22;
    maxTimestep: number;
    /**
     * @see b2Controller::Step
     */
    Step(step: b2TimeStep): void;
    private static Step_s_damping;
    Draw(draw: b2Draw): void;
    /**
     * Sets damping independantly along the x and y axes
     */
    SetAxisAligned(xDamping: number, yDamping: number): void;
}
