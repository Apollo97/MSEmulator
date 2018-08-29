// DEBUG: import { b2Assert } from "../../Common/b2Settings";
import { b2MakeArray } from "../../Common/b2Settings";
import { b2ShapeType } from "../../Collision/Shapes/b2Shape";
import { b2CircleContact } from "./b2CircleContact";
import { b2PolygonContact } from "./b2PolygonContact";
import { b2PolygonAndCircleContact } from "./b2PolygonAndCircleContact";
import { b2EdgeAndCircleContact } from "./b2EdgeAndCircleContact";
import { b2EdgeAndPolygonContact } from "./b2EdgeAndPolygonContact";
import { b2ChainAndCircleContact } from "./b2ChainAndCircleContact";
import { b2ChainAndPolygonContact } from "./b2ChainAndPolygonContact";
export class b2ContactRegister {
    constructor() {
        // public pool: b2Contact[];
        this.createFcn = null;
        this.destroyFcn = null;
        this.primary = false;
    }
}
export class b2ContactFactory {
    constructor(allocator) {
        this.m_allocator = null;
        this.m_allocator = allocator;
        this.InitializeRegisters();
    }
    AddType(createFcn, destroyFcn, type1, type2) {
        const pool = b2MakeArray(256, (i) => createFcn(this.m_allocator)); // TODO: b2Settings
        function poolCreateFcn(allocator) {
            // if (pool.length > 0) {
            //   return pool.pop();
            // }
            // return createFcn(allocator);
            return pool.pop() || createFcn(allocator);
        }
        function poolDestroyFcn(contact, allocator) {
            pool.push(contact);
        }
        // this.m_registers[type1][type2].pool = pool;
        this.m_registers[type1][type2].createFcn = poolCreateFcn;
        this.m_registers[type1][type2].destroyFcn = poolDestroyFcn;
        this.m_registers[type1][type2].primary = true;
        if (type1 !== type2) {
            // this.m_registers[type2][type1].pool = pool;
            this.m_registers[type2][type1].createFcn = poolCreateFcn;
            this.m_registers[type2][type1].destroyFcn = poolDestroyFcn;
            this.m_registers[type2][type1].primary = false;
        }
        /*
        this.m_registers[type1][type2].createFcn = createFcn;
        this.m_registers[type1][type2].destroyFcn = destroyFcn;
        this.m_registers[type1][type2].primary = true;
    
        if (type1 !== type2) {
          this.m_registers[type2][type1].createFcn = createFcn;
          this.m_registers[type2][type1].destroyFcn = destroyFcn;
          this.m_registers[type2][type1].primary = false;
        }
        */
    }
    InitializeRegisters() {
        this.m_registers = [ /*b2ShapeType.e_shapeTypeCount*/];
        for (let i = 0; i < b2ShapeType.e_shapeTypeCount; i++) {
            this.m_registers[i] = [ /*b2ShapeType.e_shapeTypeCount*/];
            for (let j = 0; j < b2ShapeType.e_shapeTypeCount; j++) {
                this.m_registers[i][j] = new b2ContactRegister();
            }
        }
        this.AddType(b2CircleContact.Create, b2CircleContact.Destroy, b2ShapeType.e_circleShape, b2ShapeType.e_circleShape);
        this.AddType(b2PolygonAndCircleContact.Create, b2PolygonAndCircleContact.Destroy, b2ShapeType.e_polygonShape, b2ShapeType.e_circleShape);
        this.AddType(b2PolygonContact.Create, b2PolygonContact.Destroy, b2ShapeType.e_polygonShape, b2ShapeType.e_polygonShape);
        this.AddType(b2EdgeAndCircleContact.Create, b2EdgeAndCircleContact.Destroy, b2ShapeType.e_edgeShape, b2ShapeType.e_circleShape);
        this.AddType(b2EdgeAndPolygonContact.Create, b2EdgeAndPolygonContact.Destroy, b2ShapeType.e_edgeShape, b2ShapeType.e_polygonShape);
        this.AddType(b2ChainAndCircleContact.Create, b2ChainAndCircleContact.Destroy, b2ShapeType.e_chainShape, b2ShapeType.e_circleShape);
        this.AddType(b2ChainAndPolygonContact.Create, b2ChainAndPolygonContact.Destroy, b2ShapeType.e_chainShape, b2ShapeType.e_polygonShape);
    }
    Create(fixtureA, indexA, fixtureB, indexB) {
        const type1 = fixtureA.GetType();
        const type2 = fixtureB.GetType();
        // DEBUG: b2Assert(0 <= type1 && type1 < b2ShapeType.e_shapeTypeCount);
        // DEBUG: b2Assert(0 <= type2 && type2 < b2ShapeType.e_shapeTypeCount);
        const reg = this.m_registers[type1][type2];
        if (reg.createFcn) {
            const c = reg.createFcn(this.m_allocator);
            if (reg.primary) {
                c.Reset(fixtureA, indexA, fixtureB, indexB);
            }
            else {
                c.Reset(fixtureB, indexB, fixtureA, indexA);
            }
            return c;
        }
        else {
            return null;
        }
    }
    Destroy(contact) {
        const fixtureA = contact.m_fixtureA;
        const fixtureB = contact.m_fixtureB;
        if (contact.m_manifold.pointCount > 0 &&
            !fixtureA.IsSensor() &&
            !fixtureB.IsSensor()) {
            fixtureA.GetBody().SetAwake(true);
            fixtureB.GetBody().SetAwake(true);
        }
        const typeA = fixtureA.GetType();
        const typeB = fixtureB.GetType();
        // DEBUG: b2Assert(0 <= typeA && typeB < b2ShapeType.e_shapeTypeCount);
        // DEBUG: b2Assert(0 <= typeA && typeB < b2ShapeType.e_shapeTypeCount);
        const reg = this.m_registers[typeA][typeB];
        if (reg.destroyFcn) {
            reg.destroyFcn(contact, this.m_allocator);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDb250YWN0RmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0JveDJEL0R5bmFtaWNzL0NvbnRhY3RzL2IyQ29udGFjdEZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkRBQTZEO0FBQzdELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFN0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3RELE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQ3hFLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ2xFLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBR3RFLE1BQU0sT0FBTyxpQkFBaUI7SUFBOUI7UUFDRSw0QkFBNEI7UUFDckIsY0FBUyxHQUEyQyxJQUFJLENBQUM7UUFDekQsZUFBVSxHQUEwRCxJQUFJLENBQUM7UUFDekUsWUFBTyxHQUFZLEtBQUssQ0FBQztJQUNsQyxDQUFDO0NBQUE7QUFFRCxNQUFNLE9BQU8sZ0JBQWdCO0lBSTNCLFlBQVksU0FBYztRQUhuQixnQkFBVyxHQUFRLElBQUksQ0FBQztRQUk3QixJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztRQUM3QixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRU8sT0FBTyxDQUFDLFNBQXdDLEVBQUUsVUFBd0QsRUFBRSxLQUFrQixFQUFFLEtBQWtCO1FBQ3hK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