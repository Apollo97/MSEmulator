/*
* Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
*
* This software is provided 'as-is', without any express or implied
* warranty.  In no event will the authors be held liable for any damages
* arising from the use of this software.
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
* 1. The origin of this software must not be misrepresented; you must not
* claim that you wrote the original software. If you use this software
* in a product, an acknowledgment in the product documentation would be
* appreciated but is not required.
* 2. Altered source versions must be plainly marked as such, and must not be
* misrepresented as being the original software.
* 3. This notice may not be removed or altered from any source distribution.
*/
// DEBUG: import { b2Assert } from "../../Common/b2Settings";
import { b2Maybe } from "../../Common/b2Settings";
import { b2Vec2 } from "../../Common/b2Math";
export var b2JointType;
(function (b2JointType) {
    b2JointType[b2JointType["e_unknownJoint"] = 0] = "e_unknownJoint";
    b2JointType[b2JointType["e_revoluteJoint"] = 1] = "e_revoluteJoint";
    b2JointType[b2JointType["e_prismaticJoint"] = 2] = "e_prismaticJoint";
    b2JointType[b2JointType["e_distanceJoint"] = 3] = "e_distanceJoint";
    b2JointType[b2JointType["e_pulleyJoint"] = 4] = "e_pulleyJoint";
    b2JointType[b2JointType["e_mouseJoint"] = 5] = "e_mouseJoint";
    b2JointType[b2JointType["e_gearJoint"] = 6] = "e_gearJoint";
    b2JointType[b2JointType["e_wheelJoint"] = 7] = "e_wheelJoint";
    b2JointType[b2JointType["e_weldJoint"] = 8] = "e_weldJoint";
    b2JointType[b2JointType["e_frictionJoint"] = 9] = "e_frictionJoint";
    b2JointType[b2JointType["e_ropeJoint"] = 10] = "e_ropeJoint";
    b2JointType[b2JointType["e_motorJoint"] = 11] = "e_motorJoint";
    b2JointType[b2JointType["e_areaJoint"] = 12] = "e_areaJoint";
})(b2JointType || (b2JointType = {}));
export var b2LimitState;
(function (b2LimitState) {
    b2LimitState[b2LimitState["e_inactiveLimit"] = 0] = "e_inactiveLimit";
    b2LimitState[b2LimitState["e_atLowerLimit"] = 1] = "e_atLowerLimit";
    b2LimitState[b2LimitState["e_atUpperLimit"] = 2] = "e_atUpperLimit";
    b2LimitState[b2LimitState["e_equalLimits"] = 3] = "e_equalLimits";
})(b2LimitState || (b2LimitState = {}));
export class b2Jacobian {
    constructor() {
        this.linear = new b2Vec2();
        this.angularA = 0;
        this.angularB = 0;
    }
    SetZero() {
        this.linear.SetZero();
        this.angularA = 0;
        this.angularB = 0;
        return this;
    }
    Set(x, a1, a2) {
        this.linear.Copy(x);
        this.angularA = a1;
        this.angularB = a2;
        return this;
    }
}
/// A joint edge is used to connect bodies and joints together
/// in a joint graph where each body is a node and each joint
/// is an edge. A joint edge belongs to a doubly linked list
/// maintained in each attached body. Each joint has two joint
/// nodes, one for each attached body.
export class b2JointEdge {
    constructor(joint, other) {
        this.prev = null; ///< the previous joint edge in the body's joint list
        this.next = null; ///< the next joint edge in the body's joint list
        this.joint = joint;
        this.other = other;
    }
}
/// Joint definitions are used to construct joints.
export class b2JointDef {
    constructor(type) {
        /// The joint type is set automatically for concrete joint types.
        this.type = b2JointType.e_unknownJoint;
        /// Use this to attach application specific data to your joints.
        this.userData = null;
        /// Set this flag to true if the attached bodies should collide.
        this.collideConnected = false;
        this.type = type;
    }
}
/// The base joint class. Joints are used to constraint two bodies together in
/// various fashions. Some joints also feature limits and motors.
export class b2Joint {
    constructor(def) {
        // DEBUG: b2Assert(def.bodyA !== def.bodyB);
        this.m_type = b2JointType.e_unknownJoint;
        this.m_prev = null;
        this.m_next = null;
        this.m_index = 0;
        this.m_islandFlag = false;
        this.m_collideConnected = false;
        this.m_userData = null;
        this.m_type = def.type;
        this.m_edgeA = new b2JointEdge(this, def.bodyB);
        this.m_edgeB = new b2JointEdge(this, def.bodyA);
        this.m_bodyA = def.bodyA;
        this.m_bodyB = def.bodyB;
        this.m_collideConnected = b2Maybe(def.collideConnected, false);
        this.m_userData = def.userData;
    }
    /// Get the type of the concrete joint.
    GetType() {
        return this.m_type;
    }
    /// Get the first body attached to this joint.
    GetBodyA() {
        return this.m_bodyA;
    }
    /// Get the second body attached to this joint.
    GetBodyB() {
        return this.m_bodyB;
    }
    /// Get the next joint the world joint list.
    GetNext() {
        return this.m_next;
    }
    /// Get the user data pointer.
    GetUserData() {
        return this.m_userData;
    }
    /// Set the user data pointer.
    SetUserData(data) {
        this.m_userData = data;
    }
    /// Short-cut function to determine if either body is inactive.
    IsActive() {
        return this.m_bodyA.IsActive() && this.m_bodyB.IsActive();
    }
    /// Get collide connected.
    /// Note: modifying the collide connect flag won't work correctly because
    /// the flag is only checked when fixture AABBs begin to overlap.
    GetCollideConnected() {
        return this.m_collideConnected;
    }
    /// Dump this joint to the log file.
    Dump(log) {
        log("// Dump is not supported for this joint type.\n");
    }
    /// Shift the origin for any points stored in world coordinates.
    ShiftOrigin(newOrigin) {
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJKb2ludC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0JveDJEL0R5bmFtaWNzL0pvaW50cy9iMkpvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsNkRBQTZEO0FBQzdELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUNsRCxPQUFPLEVBQUUsTUFBTSxFQUFNLE1BQU0scUJBQXFCLENBQUM7QUFJakQsTUFBTSxDQUFOLElBQVksV0FjWDtBQWRELFdBQVksV0FBVztJQUNyQixpRUFBa0IsQ0FBQTtJQUNsQixtRUFBbUIsQ0FBQTtJQUNuQixxRUFBb0IsQ0FBQTtJQUNwQixtRUFBbUIsQ0FBQTtJQUNuQiwrREFBaUIsQ0FBQTtJQUNqQiw2REFBZ0IsQ0FBQTtJQUNoQiwyREFBZSxDQUFBO0lBQ2YsNkRBQWdCLENBQUE7SUFDaEIsMkRBQWUsQ0FBQTtJQUNmLG1FQUFtQixDQUFBO0lBQ25CLDREQUFnQixDQUFBO0lBQ2hCLDhEQUFpQixDQUFBO0lBQ2pCLDREQUFnQixDQUFBO0FBQ2xCLENBQUMsRUFkVyxXQUFXLEtBQVgsV0FBVyxRQWN0QjtBQUVELE1BQU0sQ0FBTixJQUFZLFlBS1g7QUFMRCxXQUFZLFlBQVk7SUFDdEIscUVBQW1CLENBQUE7SUFDbkIsbUVBQWtCLENBQUE7SUFDbEIsbUVBQWtCLENBQUE7SUFDbEIsaUVBQWlCLENBQUE7QUFDbkIsQ0FBQyxFQUxXLFlBQVksS0FBWixZQUFZLFFBS3ZCO0FBRUQsTUFBTSxPQUFPLFVBQVU7SUFBdkI7UUFDa0IsV0FBTSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdkMsYUFBUSxHQUFXLENBQUMsQ0FBQztRQUNyQixhQUFRLEdBQVcsQ0FBQyxDQUFDO0lBZTlCLENBQUM7SUFiUSxPQUFPO1FBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN0QixJQUFJLENBQUMs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