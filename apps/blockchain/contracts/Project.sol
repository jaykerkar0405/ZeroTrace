// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Project {
  struct ProjectData {
    uint256 id;
    address owner;
    string metadataURI; // IPFS hash with all project details
    uint256 requestedFunding;
    uint256 receivedFunding;
    uint256 totalVotes;
    uint256 createdAt;
    ProjectStatus status;
  }

  enum ProjectStatus {
    Pending, // Submitted, waiting for approval
    Active, // Approved and live for voting
    Funded, // Received funding
    Completed, // Milestones completed
    Cancelled // Cancelled by owner or admin
  }

  mapping(uint256 => ProjectData) public projects;
  mapping(address => uint256[]) public ownerProjects;

  uint256 public projectCount;
  address public admin;

  event ProjectSubmitted(
    uint256 indexed projectId,
    address indexed owner,
    string metadataURI,
    uint256 requestedFunding
  );
  event ProjectApproved(uint256 indexed projectId);
  event ProjectStatusUpdated(uint256 indexed projectId, ProjectStatus newStatus);
  event FundingReceived(uint256 indexed projectId, uint256 amount);

  error Project__Unauthorized();
  error Project__ProjectNotFound();
  error Project__InvalidStatus();
  error Project__InvalidFundingAmount();

  constructor() {
    admin = msg.sender;
  }

  modifier onlyOwner(uint256 projectId) {
    if (projects[projectId].owner != msg.sender) {
      revert Project__Unauthorized();
    }
    _;
  }

  modifier onlyAdmin() {
    if (msg.sender != admin) {
      revert Project__Unauthorized();
    }
    _;
  }

  function submitProject(
    string calldata metadataURI,
    uint256 requestedFunding
  ) external returns (uint256) {
    if (requestedFunding == 0) {
      revert Project__InvalidFundingAmount();
    }

    uint256 projectId = ++projectCount;

    projects[projectId] = ProjectData({
      id: projectId,
      owner: msg.sender,
      metadataURI: metadataURI,
      requestedFunding: requestedFunding,
      receivedFunding: 0,
      totalVotes: 0,
      createdAt: block.timestamp,
      status: ProjectStatus.Pending
    });

    ownerProjects[msg.sender].push(projectId);

    emit ProjectSubmitted(projectId, msg.sender, metadataURI, requestedFunding);
    return projectId;
  }

  function approveProject(uint256 projectId) external onlyAdmin {
    ProjectData storage project = projects[projectId];
    if (project.id == 0) revert Project__ProjectNotFound();
    if (project.status != ProjectStatus.Pending) revert Project__InvalidStatus();

    project.status = ProjectStatus.Active;
    emit ProjectApproved(projectId);
  }

  function updateProjectStatus(
    uint256 projectId,
    ProjectStatus newStatus
  ) external onlyOwner(projectId) {
    ProjectData storage project = projects[projectId];
    if (project.id == 0) revert Project__ProjectNotFound();

    project.status = newStatus;
    emit ProjectStatusUpdated(projectId, newStatus);
  }

  function addFunding(uint256 projectId, uint256 amount) external payable {
    ProjectData storage project = projects[projectId];
    if (project.id == 0) revert Project__ProjectNotFound();

    project.receivedFunding += amount;
    if (project.receivedFunding >= project.requestedFunding) {
      project.status = ProjectStatus.Funded;
    }

    emit FundingReceived(projectId, amount);
  }

  function incrementVotes(uint256 projectId, uint256 votes) external {
    ProjectData storage project = projects[projectId];
    if (project.id == 0) revert Project__ProjectNotFound();

    project.totalVotes += votes;
  }

  function getProject(uint256 projectId) external view returns (ProjectData memory) {
    return projects[projectId];
  }

  function getOwnerProjects(address owner) external view returns (uint256[] memory) {
    return ownerProjects[owner];
  }

  function getAllProjects() external view returns (ProjectData[] memory) {
    ProjectData[] memory allProjects = new ProjectData[](projectCount);
    for (uint256 i = 1; i <= projectCount; i++) {
      allProjects[i - 1] = projects[i];
    }
    return allProjects;
  }

  function getActiveProjects() external view returns (ProjectData[] memory) {
    uint256 activeCount = 0;
    for (uint256 i = 1; i <= projectCount; i++) {
      if (projects[i].status == ProjectStatus.Active) {
        activeCount++;
      }
    }

    ProjectData[] memory activeProjects = new ProjectData[](activeCount);
    uint256 index = 0;
    for (uint256 i = 1; i <= projectCount; i++) {
      if (projects[i].status == ProjectStatus.Active) {
        activeProjects[index] = projects[i];
        index++;
      }
    }

    return activeProjects;
  }
}
