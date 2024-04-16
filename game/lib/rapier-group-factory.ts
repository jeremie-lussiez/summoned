export class RapierGroupFactory {
    
    private static groupIndex = 0;
    private static maxGroups = 16;

    private static groups: Record<string, number> = {};

    public static groupsCount(): number {
        return RapierGroupFactory.groupIndex;
    }

    public static composeGroups(memberships: string[], filters?: string[]): number {
        const membershipsMask = memberships.reduce((mask, id) => mask | RapierGroupFactory.groups[id], 0) << RapierGroupFactory.maxGroups;
        const filtersMask = filters ? filters.reduce((mask, id) => mask | RapierGroupFactory.groups[id], 0) : (1 << (RapierGroupFactory.maxGroups - 1)) - 1;
        return membershipsMask | filtersMask;
    }

    public static getGroupMaskBinaryString(mask: number): string {
        const maskString = mask.toString(2).padStart(RapierGroupFactory.maxGroups << 1, '0');
        return 'M:' + maskString.slice(0, RapierGroupFactory.maxGroups) + ' F:' + maskString.slice(RapierGroupFactory.maxGroups);
    }

    public static createGroup(id: string): number | undefined {
        if (RapierGroupFactory.groupIndex > RapierGroupFactory.maxGroups - 2) {
            return undefined;
        }
        if (RapierGroupFactory.groups[id] !== undefined) {
            return RapierGroupFactory.groups[id];
        }
        RapierGroupFactory.groups[id] = 1 << RapierGroupFactory.groupIndex;
        RapierGroupFactory.groupIndex += 1;
        return RapierGroupFactory.groups[id];
    }

}
