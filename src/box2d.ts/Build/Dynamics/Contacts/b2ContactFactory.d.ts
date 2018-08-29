import { b2Contact } from "./b2Contact";
import { b2Fixture } from "../b2Fixture";
export declare class b2ContactRegister {
    createFcn: ((allocator: any) => b2Contact) | null;
    destroyFcn: ((contact: b2Contact, allocator: any) => void) | null;
    primary: boolean;
}
export declare class b2ContactFactory {
    m_allocator: any;
    m_registers: b2ContactRegister[][];
    constructor(allocator: any);
    private AddType;
    private InitializeRegisters;
    Create(fixtureA: b2Fixture, indexA: number, fixtureB: b2Fixture, indexB: number): b2Contact | null;
    Destroy(contact: b2Contact): void;
}
