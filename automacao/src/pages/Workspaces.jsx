import RelationshipDashboard from '../components/RelationshipDashboard';

const Workspaces = () => {
  return (
    <div className="space-y-6">
      {/* Relationship Dashboard - Contém a "Hierarquia de Relacionamentos" */}
      <RelationshipDashboard showWorkspaces={true} />
    </div>
  );
};

export default Workspaces;