class Team {

    static teamCount = 0;

    constructor(teamName) {
        this.teamName = teamName || "Unnamed Team" + ++Team.teamCount;
    }
}