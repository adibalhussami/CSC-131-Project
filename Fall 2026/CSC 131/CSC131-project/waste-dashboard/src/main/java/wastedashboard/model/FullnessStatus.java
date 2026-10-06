package wastedashboard.model;

public enum FullnessStatus {
    GREEN,
    YELLOW,
    RED;

    public static FullnessStatus fromPercent(int fullnessPercent) {
        if (fullnessPercent >= 80) {
            return RED;
        }
        if (fullnessPercent >= 50) {
            return YELLOW;
        }
        return GREEN;
    }
}
