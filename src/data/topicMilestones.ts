// Default milestone templates per topic type
// Each topic gets a tailored set of milestones for thesis supervision

export interface DefaultMilestone {
  text: string;
  description: string;
}

// Generic thesis milestones (fallback)
const genericMilestones: DefaultMilestone[] = [
  {
    text: "Topic Confirmation & Scope Definition",
    description: "Finalize the thesis topic with your supervisor. Agree on research questions, expected outcomes, and boundaries of the investigation.",
  },
  {
    text: "Literature Review Completed",
    description: "Conduct a thorough review of existing research and relevant publications. Summarize key findings and identify gaps your thesis will address.",
  },
  {
    text: "Research Methodology Defined",
    description: "Select and document the research methodology. Define data collection methods, tools, frameworks, and evaluation criteria.",
  },
  {
    text: "Data Collection & Initial Analysis",
    description: "Gather all required data or build the initial prototype. Perform preliminary analysis to validate your approach and refine hypotheses.",
  },
  {
    text: "Midpoint Review with Supervisor",
    description: "Present interim findings to your supervisor. Discuss progress, challenges, and any necessary adjustments to scope or methodology.",
  },
  {
    text: "Core Implementation / Experimentation",
    description: "Complete the main body of work — implement the solution, run experiments, or finish the analytical framework.",
  },
  {
    text: "Results Documentation & Interpretation",
    description: "Document all results with proper visualizations. Interpret findings in the context of your research questions and existing literature.",
  },
  {
    text: "Draft Thesis Submitted for Review",
    description: "Submit the complete first draft to your supervisor for feedback. Include all chapters, references, and appendices.",
  },
  {
    text: "Revisions & Final Editing",
    description: "Incorporate supervisor feedback. Proofread, refine arguments, check formatting, and ensure academic standards are met.",
  },
  {
    text: "Final Submission & Defense Preparation",
    description: "Submit the final thesis document. Prepare presentation slides and rehearse for the oral defense or colloquium.",
  },
];

// Topic-specific milestone overrides keyed by topic ID
const topicSpecificMilestones: Record<string, DefaultMilestone[]> = {
  "topic-01": [
    { text: "Dataset Acquisition & Preprocessing", description: "Obtain historical demand, weather, and promotional data from Nestle's European network. Clean and normalize datasets for ML pipeline input." },
    { text: "Exploratory Data Analysis", description: "Analyze seasonal patterns, correlations between weather and demand, and promotional lift effects across product categories." },
    { text: "Feature Engineering & Selection", description: "Design features from weather forecasts, calendar events, and promotional schedules. Use statistical tests to select the most predictive variables." },
    { text: "Baseline Model Development", description: "Implement baseline forecasting models (ARIMA, exponential smoothing) to establish performance benchmarks for comparison." },
    { text: "ML Model Training & Tuning", description: "Train advanced ML models (gradient boosting, LSTM networks) on the prepared dataset. Optimize hyperparameters via cross-validation." },
    { text: "Model Evaluation & Comparison", description: "Compare ML models against baselines using MAPE, RMSE, and waste reduction metrics. Quantify potential savings in francs." },
    { text: "Pipeline Integration Design", description: "Design the end-to-end forecasting pipeline architecture for deployment within Nestle's existing supply chain systems." },
    { text: "Draft & Review", description: "Write up methodology, results, and business impact analysis. Submit draft for supervisor feedback and iterate." },
    { text: "Final Submission", description: "Finalize the thesis document incorporating all feedback. Prepare defense presentation with key findings and demos." },
  ],
  "topic-03": [
    { text: "Clinical Dataset Access & Ethics Approval", description: "Obtain access to Roche's proprietary multi-omics datasets. Complete all necessary ethics and data governance approvals." },
    { text: "Data Integration Pipeline", description: "Build a computational pipeline to integrate transcriptomic, proteomic, and metabolomic data into a unified analysis framework." },
    { text: "Statistical Analysis & Feature Selection", description: "Apply dimensionality reduction and statistical methods to identify candidate biomarker signatures across omics layers." },
    { text: "Machine Learning Model Development", description: "Train classification models to distinguish disease states using selected biomarker panels. Validate with cross-validation strategies." },
    { text: "Biological Validation & Interpretation", description: "Map discovered biomarkers to known biological pathways. Assess clinical relevance and potential for drug target validation." },
    { text: "Results Documentation", description: "Document all findings with publication-quality figures. Write results and discussion chapters of the thesis." },
    { text: "Supervisor & Industry Review", description: "Present findings to both academic supervisor and Roche mentors. Incorporate feedback from both perspectives." },
    { text: "Final Submission & Defense", description: "Submit final thesis and prepare oral defense. Include supplementary computational notebooks and reproducibility documentation." },
  ],
  "topic-07": [
    { text: "Privacy Framework Analysis", description: "Review Swiss data protection law and federated learning privacy guarantees. Define compliance requirements for the ML pipeline." },
    { text: "Network Data Characterization", description: "Analyze Swisscom's anonymized network performance data. Identify optimization targets and key performance indicators." },
    { text: "Federated Learning Architecture Design", description: "Design the federated learning system architecture including client selection, aggregation strategy, and communication protocols." },
    { text: "Prototype Implementation", description: "Implement the federated learning pipeline using simulated network nodes. Test with synthetic data before real deployment." },
    { text: "Privacy-Utility Tradeoff Analysis", description: "Evaluate differential privacy mechanisms and their impact on model accuracy. Find optimal privacy budget settings." },
    { text: "Performance Benchmarking", description: "Compare federated approach against centralized training and existing optimization methods. Measure network KPI improvements." },
    { text: "Regulatory Compliance Assessment", description: "Document how the solution meets Swiss data protection requirements. Prepare compliance documentation for legal review." },
    { text: "Thesis Writing & Defense", description: "Complete the thesis manuscript. Prepare presentation highlighting privacy-preserving innovation and practical network improvements." },
  ],
  "topic-15": [
    { text: "Literature Survey on Generative Models", description: "Review state-of-the-art generative AI for molecular design including VAEs, diffusion models, and RL-based approaches." },
    { text: "Dataset Preparation", description: "Curate molecular datasets from Novartis's oncology pipeline. Prepare molecular representations (SMILES, graphs) for model training." },
    { text: "VAE Model Implementation", description: "Implement and train a variational autoencoder for molecular generation. Evaluate generated molecules for chemical validity." },
    { text: "Diffusion Model Implementation", description: "Build and train a diffusion-based molecular generator. Compare latent space properties with the VAE approach." },
    { text: "RL-Based Optimization", description: "Implement reinforcement learning for optimizing binding affinity and ADMET properties. Define reward functions with domain experts." },
    { text: "Comparative Analysis", description: "Benchmark all three approaches on binding affinity prediction, drug-likeness scores, and synthetic accessibility." },
    { text: "Lead Candidate Selection", description: "Identify top-scoring generated molecules for potential wet-lab validation. Document structure-activity relationships." },
    { text: "Final Thesis & Presentation", description: "Write the complete thesis with emphasis on practical pharma applications. Prepare defense with molecular visualization demos." },
  ],
};

export function getDefaultMilestones(topicId?: string | null): DefaultMilestone[] {
  if (topicId && topicSpecificMilestones[topicId]) {
    return topicSpecificMilestones[topicId];
  }
  return genericMilestones;
}
