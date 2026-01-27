function Sidebar() {
  const isLogged = !!localStorage.getItem("token");

  return (
    <div className="sidebar">
      <h2>Mini-RAG</h2>

      <button className="new-chat">+ Nouvelle discussion</button>

      <div className="sidebar-footer">
        {isLogged && (
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Déconnexion
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
