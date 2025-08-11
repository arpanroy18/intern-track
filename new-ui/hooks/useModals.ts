import { useState, useCallback } from 'react';

export function useModals() {
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
    const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
    const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
    const [showUserSettingsModal, setShowUserSettingsModal] = useState<boolean>(false);
    const [showSeasonsManagementModal, setShowSeasonsManagementModal] = useState<boolean>(false);
    const [showEditSeasonModal, setShowEditSeasonModal] = useState<boolean>(false);
    const [showAIParseModal, setShowAIParseModal] = useState<boolean>(false);
    const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

    const closeAllModals = useCallback(() => {
        setShowAddModal(false);
        setShowDetailsModal(false);
        setShowTimelineModal(false);
        setShowFolderModal(false);
        setShowUserSettingsModal(false);
        setShowSeasonsManagementModal(false);
        setShowEditSeasonModal(false);
        setShowAIParseModal(false);
        setShowErrorModal(false);
    }, []);

    return {
        showAddModal, setShowAddModal,
        showDetailsModal, setShowDetailsModal,
        showTimelineModal, setShowTimelineModal,
        showFolderModal, setShowFolderModal,
        showUserSettingsModal, setShowUserSettingsModal,
        showSeasonsManagementModal, setShowSeasonsManagementModal,
        showEditSeasonModal, setShowEditSeasonModal,
        showAIParseModal, setShowAIParseModal,
        showErrorModal, setShowErrorModal,
        closeAllModals
    };
}
